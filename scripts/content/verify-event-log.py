"""Execute the exact canonical Python companions; no copied implementation.

python3 scripts/content/verify-event-log.py [--json] [--scale 1000000]
Missing Python fails the npm/CI verification command instead of skipping it.
"""
import argparse
import gc
import json
from pathlib import Path
import sys
import time
import types
import unittest
from concurrent.futures import ThreadPoolExecutor

ROOT = Path(__file__).resolve().parents[2]
COLLECTION = json.loads((ROOT / 'content/interviews/real-world.json').read_text())
QUESTION = next(q for q in COLLECTION['questions'] if q['slug'] == 'partitioned-event-log')
MODULES = {}
for track in QUESTION['solutionTracks']:
    name = 'authored_event_log_' + track['id'].replace('-', '_')
    module = types.ModuleType(name)
    sys.modules[name] = module
    exec(compile(track['python']['code'], name, 'exec'), module.__dict__)
    MODULES[track['id']] = module

def ids(events):
    return [event.id for event in events]

class AuthoredEventLogs(unittest.TestCase):
    def test_read_oracle_and_ownership(self):
        for name, mod in MODULES.items():
            with self.subTest(track=name):
                log = mod.EventLog(block_size=4)
                oracle = []
                for i in range(127):
                    key = f'user-{i * 17 % 7}'
                    self.assertEqual(log.append(key, {'i': i}), i)
                    oracle.append((i, key, {'i': i}))
                    if i % 19 == 0:
                        log.add_node()
                for offset in range(131):
                    for limit in [0, 1, 3, 100]:
                        self.assertEqual([(e.id, e.key, e.value) for e in log.read(offset, limit)], [e for e in oracle if e[0] >= offset][:limit])
                        for key in ['user-0', 'user-6', 'missing']:
                            self.assertEqual([(e.id, e.key, e.value) for e in log.read_key(key, offset, limit)], [e for e in oracle if e[1] == key and e[0] >= offset][:limit])
                stats = log.stats()
                self.assertEqual(sum(node['event_count'] for node in stats), 127)
                keys = [key for node in stats for key in node['keys']]
                self.assertEqual(len(keys), 7)
                self.assertEqual(len(set(keys)), 7)
                self.assertEqual(log.read(2**70), [])
                self.assertEqual(log.read_key('user-0', 2**70), [])

    def test_cursor_tail_future_offset_and_migration(self):
        for name, mod in MODULES.items():
            with self.subTest(track=name):
                log = mod.EventLog(block_size=2)
                first, future = log.cursor('a'), log.cursor('a', 8)
                self.assertEqual(first.next(), [])
                for i in range(8):
                    log.append('b' if i % 2 else 'a', i)
                second = log.cursor('a', 1)
                self.assertEqual(ids(first.next(2)), [0, 2])
                self.assertEqual(first.next_offset, 3)
                self.assertEqual(ids(second.next(1)), [2])
                self.assertEqual(future.next(), [])
                self.assertEqual(future.next_offset, 8)
                log.add_node()
                self.assertEqual(len(log.stats()[1]['keys']), 1)
                self.assertEqual(ids(first.next()), [4, 6])
                self.assertEqual(ids(second.next()), [4, 6])
                self.assertEqual(first.next(), [])
                log.append('a', 8)
                self.assertEqual(ids(first.next()), [8])
                self.assertEqual(ids(future.next()), [8])
                self.assertEqual(future.next_offset, 9)
                # Critical partly filled final block, not only full-block cases.
                log = mod.EventLog(block_size=4)
                log.append('a', 0)
                pending = log.cursor('a', 3)
                self.assertEqual(pending.next(), [])
                for i in range(1, 5):
                    log.append('a', i)
                self.assertEqual(ids(pending.next()), [3, 4])

    def test_threaded_publication_reads_and_growth(self):
        for name, mod in MODULES.items():
            with self.subTest(track=name):
                log = mod.EventLog(block_size=8, auto_threshold=30, cooldown=10, max_nodes=4)
                def work(worker):
                    output = []
                    for i in range(100):
                        output.append(log.append(f'u{worker % 4}', (worker, i)))
                        page = log.read(0, 10)
                        self.assertEqual(ids(page), list(range(len(page))))
                        if i % 25 == 0:
                            log.read_key(f'u{worker % 4}', 1, 3)
                    return output
                with ThreadPoolExecutor(max_workers=8) as pool:
                    assigned = [event_id for batch in pool.map(work, range(8)) for event_id in batch]
                self.assertEqual(sorted(assigned), list(range(800)))
                self.assertEqual(ids(log.read(0, 1000)), list(range(800)))
                self.assertEqual(len({e.value for e in log.read(0, 1000)}), 800)
                self.assertGreater(len(log.stats()), 1)
                self.assertLessEqual(len(log.stats()), 4)
                hot = mod.EventLog(auto_threshold=2, cooldown=1)
                for i in range(20):
                    hot.append('hot', i)
                self.assertEqual(len(hot.stats()), 1)

    def test_validation_and_lookups_do_not_mutate(self):
        for name, mod in MODULES.items():
            with self.subTest(track=name):
                log = mod.EventLog()
                for operation in [lambda: log.append('', None), lambda: log.read(-1), lambda: log.read(0, -1), lambda: log.read(0, 10001), lambda: log.read(0, 1.5), lambda: log.read(True), lambda: log.read_key(''), lambda: mod.EventLog(block_size=0)]:
                    with self.assertRaises((ValueError, TypeError)):
                        operation()
                self.assertEqual(log.read_key('missing'), [])
                self.assertEqual(log.stats()[0]['keys'], [])
                self.assertEqual(log.append('x', None), 0)
                self.assertEqual(log.cursor('x').next(0), [])
                self.assertEqual(mod.EventLog().append('x', None), 0)

    def test_seek_does_not_read_the_entire_prefix(self):
        for name, mod in MODULES.items():
            with self.subTest(track=name):
                reads = [0]
                class Probe:
                    def __init__(self, event_id): self.event_id = event_id
                    @property
                    def id(self):
                        reads[0] += 1
                        return self.event_id
                store = mod.KeyStore(32)
                for i in range(10000):
                    store.append(Probe(i * 3))
                reads[0] = 0
                take = store.reader(29990)
                self.assertEqual([take().id, take().id, take().id], [29991, 29994, 29997])
                self.assertIsNone(take())
                self.assertLess(reads[0], 100)

def snapshot():
    output = {}
    for name, mod in MODULES.items():
        log = mod.EventLog(block_size=2)
        log.append('user-1', 'click'); log.append('user-2', 'view'); log.append('user-1', 'purchase')
        cursor = log.cursor('user-1', 1)
        first = ids(cursor.next(1))
        log.add_node(); log.append('user-1', 'refund')
        output[name] = dict(global_=ids(log.read()), key=ids(log.read_key('user-1', 1)), first=first, later=ids(cursor.next()), nextOffset=str(cursor.next_offset))
        output[name]['global'] = output[name].pop('global_')
    return output

def scale(count):
    for name, mod in MODULES.items():
        start = time.monotonic()
        log = mod.EventLog()
        for i in range(count):
            log.append('hot', i)
            if i % 16 == 0:
                log.append('other', i)
        tail = log.read_key('hot', log._next_id - 20, 5)
        assert len(tail) == 5
        assert all(a.id < b.id for a, b in zip(tail, tail[1:]))
        cursor = log.cursor('hot')
        read = 0
        while batch := cursor.next(10000):
            read += len(batch)
        assert read == count
        log.add_node()
        assert sum(n['event_count'] for n in log.stats()) == count + (count + 15) // 16
        print(f'{name}: {count:,} events for hot key; seek, full cursor traversal and ownership passed in {time.monotonic()-start:.2f}s (local observation, not a benchmark guarantee).', file=sys.stderr)
        del log, cursor, batch, tail
        gc.collect()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--json', action='store_true')
    parser.add_argument('--scale', type=int)
    args = parser.parse_args()
    result = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(AuthoredEventLogs))
    if not result.wasSuccessful(): sys.exit(1)
    if args.scale:
        if args.scale < 100: parser.error('--scale must be at least 100')
        scale(args.scale)
    print(json.dumps(snapshot()) if args.json else 'Validated all three exact Python event-log companions.')
