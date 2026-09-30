"""Execute only repository-authored interview companions with inert adapters.

No third-party packages or network access are used. Missing/broken code fails CI.
"""
import asyncio
import copy
import json
from pathlib import Path
import sys
import unittest
from urllib.parse import urlparse, parse_qs

ROOT = Path(__file__).resolve().parents[2]
COLLECTION = json.loads((ROOT / 'content/interviews/frontend-practice.json').read_text())
MODULES = {}
for question in COLLECTION['questions']:
    for track in question['solutionTracks']:
        namespace = {'__name__': 'authored_solution'}
        exec(compile(track['python']['code'], f'{question["slug"]}/{track["id"]}.py', 'exec'), namespace)
        MODULES[(question['slug'], track['id'])] = namespace

TREE = [{'id': 'root', 'name': 'src', 'type': 'folder', 'children': [
    {'id': 'child', 'name': 'src', 'type': 'folder', 'children': [{'id': 'file', 'name': 'x', 'type': 'file'}]},
    {'id': 'empty', 'name': 'empty', 'type': 'folder', 'children': []}]}]
OPTIONS = [{'id': 'ts', 'label': 'TypeScript'}, {'id': 'js', 'label': 'JavaScript'}, {'id': 'next', 'label': 'Next.js', 'disabled': True}]

def oracle(board):
    """Independent scan using slices, without the authored last-move/window logic."""
    lines = board + [list(column) for column in zip(*board)]
    for line in lines:
        for start in range(len(line) - 3):
            group = line[start:start + 4]
            if group[0] is not None and group == [group[0]] * 4:
                return group[0]
    return None

class AuthoredSolutions(unittest.TestCase):
    def test_dimensions_and_independent_rows(self):
        for (topic, name), mod in MODULES.items():
            if topic != 'dynamic-board':
                continue
            with self.subTest(track=name):
                for rows, cols in [(0, 3), (3, 0), (2, 3), (5, 1), (1, 7)]:
                    board = mod['create_board'](rows, cols)
                    self.assertEqual(board, [[r * cols + c for c in range(cols)] for r in range(rows)])
                board = mod['create_board'](2, 3)
                board[0][0] = 99
                self.assertEqual(board[1], [3, 4, 5])
                for pair in [(-1, 3), (1.5, 3), (2, 51), (True, 3)]:
                    with self.assertRaises(ValueError): mod['create_board'](*pair)

    def test_sampling(self):
        for (topic, name), mod in MODULES.items():
            if topic != 'random-matrix': continue
            with self.subTest(track=name):
                for seed in range(20):
                    for k in range(7):
                        board = mod['create_matrix'](2, 3, k, mod['seeded'](seed))
                        self.assertEqual(sum(row.count(0) for row in board), k)
                        self.assertTrue(all(value in (0, 1) for row in board for value in row))
                        self.assertIsNot(board[0], board[1])
                for k in [-1, 7, 1.1, True]:
                    with self.assertRaises(ValueError): mod['create_matrix'](2, 3, k)
                self.assertEqual(mod['create_matrix'](0, 3, 0), [])

    def test_games_against_independent_oracle(self):
        for (topic, name), mod in MODULES.items():
            if topic not in ('click-board', 'column-game'): continue
            with self.subTest(topic=topic, track=name):
                for seed in range(30):
                    game = mod['create_game']()
                    for step in range(80):
                        before = copy.deepcopy(game)
                        row = (step * 3 + seed) % mod['ROWS']
                        col = (step * 5 + step // 3 + seed) % mod['COLUMNS']
                        next_game = mod['move'](game, row, col)
                        self.assertEqual(game, before, 'Move mutated its input')
                        board = mod['board_of'](next_game)
                        self.assertEqual(next_game['winner'], oracle(board))
                        self.assertEqual(next_game['draw'], not next_game['winner'] and all(cell is not None for line in board for cell in line))
                        if next_game['moves'] == game['moves']:
                            self.assertIs(next_game, game)
                        if game['winner'] or game['draw']:
                            self.assertIs(next_game, game)
                        if topic == 'column-game':
                            for column in zip(*board):
                                tokens_started = False
                                for cell in column:
                                    if cell is not None: tokens_started = True
                                    elif tokens_started: self.fail('Floating token')
                        game = next_game
                game = mod['create_game']()
                self.assertIs(mod['move'](game, -1, 0), game)
                self.assertIs(mod['move'](game, 0, 99), game)
                # Same successful move fixture across all three representations.
                moves = [(0, 0), (1, 0), (0, 1), (1, 1), (0, 2), (1, 2), (0, 3)] if topic == 'click-board' else [(0, 0), (0, 0), (0, 1), (0, 1), (0, 2), (0, 2), (0, 3)]
                for r, c in moves: game = mod['move'](game, r, c)
                self.assertEqual(game['winner'], 'R')
                self.assertIs(mod['move'](game, 4, 4), game)

    def test_tree(self):
        for (topic, name), mod in MODULES.items():
            if topic != 'file-explorer': continue
            with self.subTest(track=name):
                tree = mod['normalize'](TREE) if 'normalize' in mod else TREE
                self.assertEqual([row['id'] for row in mod['visible_rows'](tree, {'root', 'child'})], ['root', 'child', 'file', 'empty'])
                self.assertEqual([row['depth'] for row in mod['visible_rows'](tree, {'root', 'child'})], [0, 1, 2, 1])
                self.assertEqual([row['id'] for row in mod['visible_rows'](tree, {'child'})], ['root'])
                empty = mod['normalize']([]) if 'normalize' in mod else []
                self.assertEqual(mod['visible_rows'](empty, set()), [])
                if 'toggle' in mod:
                    ids = {'root', 'child'}
                    closed = mod['toggle'](ids, TREE[0])
                    self.assertEqual(closed, {'child'})
                    self.assertEqual(ids, {'root', 'child'})
                    self.assertEqual(mod['toggle'](closed, TREE[0]), ids)
                else:
                    self.assertTrue(mod['toggle_local'](False, TREE[0]))
                    self.assertFalse(mod['toggle_local'](False, {'type': 'file'}))
                if 'normalize' in mod:
                    with self.assertRaises(ValueError): mod['normalize'](TREE + TREE)

    def test_selection(self):
        for (topic, name), mod in MODULES.items():
            if topic != 'multi-select': continue
            with self.subTest(track=name):
                state = mod['initial_state']()
                for action in [{'type': 'query', 'value': 'SCRIPT'}, {'type': 'select', 'id': 'next'}, {'type': 'select', 'id': 'missing'}]:
                    state = mod['reduce'](state, action, OPTIONS)
                self.assertEqual([o['id'] for o in mod['visible_options'](OPTIONS, state)], ['ts', 'js'])
                selected = mod['reduce'](state, {'type': 'select', 'id': 'ts'}, OPTIONS)
                self.assertEqual(selected['selected'], ['ts'])
                self.assertEqual(selected['query'], '')
                self.assertEqual(state['selected'], [])
                self.assertEqual(mod['reduce'](selected, {'type': 'select', 'id': 'ts'}, OPTIONS)['selected'], ['ts'])
                removed = mod['reduce'](selected, {'type': 'remove', 'id': 'ts'}, OPTIONS)
                self.assertEqual(len(mod['visible_options'](OPTIONS, removed)), 3)
                self.assertFalse(mod['reduce'](removed, {'type': 'close'}, OPTIONS)['open'])
                self.assertTrue(mod['reduce'](removed, {'type': 'open'}, OPTIONS)['open'])
                self.assertEqual(mod['visible_options'](OPTIONS, mod['reduce'](removed, {'type': 'query', 'value': 'zzzzz'}, OPTIONS)), [])
                if 'SelectionController' in mod:
                    observed = []
                    controller = mod['SelectionController'](OPTIONS, observed.append)
                    controller.dispatch({'type': 'select', 'id': 'ts'})
                    self.assertEqual(observed[-1]['selected'], ['ts'])

    def test_async_matrix(self):
        async def run(mod, name):
            active, maximum = 0, 0
            async def fetcher(url, cancellation):
                nonlocal active, maximum
                if url == '/userList': return {'ok': True, 'status': 200, 'data': [{'name': 'ada'}, {'name': 'grace'}, {'name': 'linus'}]}
                active += 1; maximum = max(maximum, active)
                await asyncio.sleep(0)
                active -= 1
                parsed = urlparse(url)
                username = parsed.path.split('/')[2]
                page = int(parse_qs(parsed.query)['page'][0])
                if username == 'grace': return {'ok': False, 'status': 429, 'data': None}
                count = (100 if page == 1 else 3) if username == 'ada' else 2
                return {'ok': True, 'status': 200, 'data': list(range(count))}
            updates = []
            result = await mod['load_matrix'](fetcher, mod['seeded'](42), mod['Cancellation'](), updates.append)
            self.assertEqual([c['count'] for c in result], [103, None, 2])
            self.assertEqual(result[1]['error'], 'HTTP 429')
            self.assertEqual(len({c['cell'] for c in result}), 3)
            self.assertTrue(all(0 <= c['cell'] < 9 for c in result))
            self.assertTrue(all([c['cell'] for c in update] == [c['cell'] for c in result] for update in updates))
            self.assertEqual(maximum, {'sequential': 1, 'parallel': 3, 'bounded': 2}[name])
            token = mod['Cancellation']()
            async def ignores_abort(url, cancellation):
                token.cancel()
                return {'ok': True, 'status': 200, 'data': []}
            updates = []
            with self.assertRaises(mod['Cancelled']): await mod['load_matrix'](ignores_abort, mod['seeded'](1), token, updates.append)
            self.assertEqual(updates, [])
            token = mod['Cancellation']()
            started, release = asyncio.Event(), asyncio.Event()
            async def late_page(url, cancellation):
                if url == '/userList':
                    return {'ok': True, 'status': 200, 'data': [{'name': 'ada'}]}
                started.set()
                await release.wait()  # Deliberately ignores the cancellation token.
                return {'ok': True, 'status': 200, 'data': [{'id': 1}]}
            stale_updates = []
            old_load = asyncio.create_task(mod['load_matrix'](late_page, mod['seeded'](9), token, stale_updates.append))
            await started.wait()
            before_cancel = len(stale_updates)
            token.cancel()
            fresh = await mod['load_matrix'](fetcher, mod['seeded'](10), mod['Cancellation'](), lambda _: None)
            release.set()
            with self.assertRaises(mod['Cancelled']): await old_load
            self.assertEqual(len(stale_updates), before_cancel)
            self.assertEqual(fresh[0]['count'], 103)
            async def empty(url, cancellation): return {'ok': True, 'status': 200, 'data': []}
            self.assertEqual(await mod['load_matrix'](empty, mod['seeded'](1), mod['Cancellation'](), lambda _: None), [])
            async def invalid(url, cancellation): return {'ok': True, 'status': 200, 'data': [{'name': ''}]}
            with self.assertRaises(ValueError): await mod['load_matrix'](invalid, mod['seeded'](1), mod['Cancellation'](), lambda _: None)
        for (topic, name), mod in MODULES.items():
            if topic == 'user-matrix':
                with self.subTest(track=name): asyncio.run(run(mod, name))

def parity_snapshot():
    output = {}
    for (topic, name), mod in MODULES.items():
        key = f'{topic}/{name}'
        if topic == 'dynamic-board': output[key] = mod['create_board'](2, 3)
        elif topic == 'random-matrix': output[key] = mod['create_matrix'](3, 5, 6, mod['seeded'](123))
        elif topic in ('click-board', 'column-game'):
            game = mod['create_game']()
            for r, c in [(0, 0), (1, 0), (0, 1), (1, 1), (0, 2), (1, 2), (0, 3)]: game = mod['move'](game, r, c)
            output[key] = {'board': mod['board_of'](game), 'winner': game['winner'], 'player': game['player'], 'moves': game['moves']}
        elif topic == 'file-explorer': output[key] = mod['visible_rows'](mod['normalize'](TREE) if 'normalize' in mod else TREE, {'root', 'child'})
        elif topic == 'multi-select': output[key] = mod['reduce'](mod['initial_state'](), {'type': 'select', 'id': 'ts'}, OPTIONS)
        elif topic == 'user-matrix': output[key] = mod['place_users'](['ada', 'grace', 'linus'], mod['seeded'](42))
    return output

if __name__ == '__main__':
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(AuthoredSolutions)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    if not result.wasSuccessful(): sys.exit(1)
    if '--json' in sys.argv: print(json.dumps(parity_snapshot()))
    else: print(f'Validated all {len(MODULES)} authored Python companions.')
