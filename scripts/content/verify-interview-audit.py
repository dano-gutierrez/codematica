"""Run regression fixtures against canonical company-interview Python examples."""
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]


def load(company, question, track):
    collection = json.loads((ROOT / 'content/interviews' / f'{company}.json').read_text())
    prompt = next(q for q in collection['questions'] if q['slug'] == question)
    solution = next(t for t in prompt['solutionTracks'] if t['id'] == track)
    namespace = {}
    exec(compile(solution['languages']['python']['code'], f'{company}/{question}/{track}', 'exec'), namespace)
    return namespace


class AuditExamples(unittest.TestCase):
    def test_all_company_snippets_parse(self):
        count = 0
        for path in (ROOT / 'content/interviews').glob('*.json'):
            for question in json.loads(path.read_text())['questions']:
                if question.get('kind') == 'web':
                    continue
                for track in question['solutionTracks']:
                    compile(track['languages']['python']['code'], str(path), 'exec')
                    count += 1
        self.assertEqual(count, 54)

    def test_filesystems(self):
        for track, cls in [('path-trie', 'FileSystem'), ('flat-map-index', 'FileSystemMap')]:
            f = load('airbnb', 'in-memory-file-system', track)[cls]()
            f.mkdir('/a'); f.addContentToFile('/a/x', 'one'); f.addContentToFile('/a/x', 'two')
            self.assertEqual(f.readContentFromFile('/a/x'), 'onetwo')
            self.assertEqual(f.ls('/a'), ['x'])

    def test_stack_top_and_minimum(self):
        for track, cls in [('value-and-min-stacks', 'MinStack'), ('encoded-delta-stack', 'MinStackEncoded')]:
            s = load('microsoft', 'min-stack', track)[cls]()
            for value in [4, -2, -2]: s.push(value)
            self.assertEqual(s.top(), -2); s.pop(); self.assertEqual(s.get_min(), -2)
            s.pop(); self.assertEqual(s.top(), 4); self.assertEqual(s.get_min(), 4)

    def test_codecs(self):
        for track, suffix in [('preorder-null-markers', ''), ('level-order-markers', '_level')]:
            n = load('microsoft', 'serialize-deserialize-binary-tree', track)
            tree = n['TreeNode'](-1, right=n['TreeNode'](7))
            for root in [None, tree]:
                wire = n['serialize' + suffix](root)
                self.assertEqual(n['serialize' + suffix](n['deserialize' + suffix](wire)), wire)

    def test_expiry(self):
        c = load('netflix', 'auto-expire-cache', 'heap-cleanup')['ExpiringCacheHeap']()
        c.set('x', 1, 2, 0); c.set('x', 2, 10, 1)
        self.assertEqual(c.get('x', 2), 2); self.assertIsNone(c.get('x', 11))

    def test_boundaries(self):
        ladder = load('google', 'word-ladder', 'bidirectional-bfs')['ladder_length_bi']
        self.assertEqual(ladder('hit', 'hit', []), 1)
        self.assertEqual(ladder('hit', 'cog', ['hot', 'dot', 'dog', 'lot', 'log', 'cog']), 5)
        bucket = load('amazon', 'top-k-frequent-items', 'frequency-buckets')['top_k_bucket']
        self.assertEqual(bucket([1, 1, 2], 0), [])
        valid = load('apple', 'validate-parentheses-stream', 'single-type-counter')['valid_by_reduction']
        self.assertTrue(valid('([{}])')); self.assertFalse(valid('([)]'))
        shortest = load('uber', 'shortest-path-weighted-road-graph', 'unweighted-bfs')['shortest_path']
        self.assertEqual(shortest({'a': [('b', 10), ('c', 1)], 'c': [('b', 1)]}, 'a', 'b'), 2)

    def test_palindrome_baseline_matches_optimized(self):
        fast = load('airbnb', 'palindrome-pairs', 'hash-split-check')['palindrome_pairs']
        slow = load('airbnb', 'palindrome-pairs', 'reverse-trie')['palindrome_pairs']
        for words in [[], ['', 'a', 'aba'], ['abcd', 'dcba', 'lls', 's', 'sssll']]:
            self.assertEqual({tuple(p) for p in fast(words)}, {tuple(p) for p in slow(words)})


if __name__ == '__main__':
    unittest.main(verbosity=2)
