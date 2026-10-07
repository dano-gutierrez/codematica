import unittest
from types import SimpleNamespace
from benchmark import measurement_key

class BenchmarkFreshnessTests(unittest.TestCase):
    def test_resumption_invalidates_when_extraction_advances_without_a_new_catalog(self):
        status={'snapshot_id':'same-catalog','semantic_complete':False,'extracted':1,'extraction_total':2,'rejected_evidence':0}
        store=SimpleNamespace(status=lambda:status)
        candidate={'title':'Index costs','body':'An index adds write work','kind':'document'}
        case={'id':'partial-update','expected_actions':['update_existing']}
        key=measurement_key(store,candidate,case)
        self.assertEqual(measurement_key(store,candidate,case),key)
        status.update(semantic_complete=True,extracted=2)
        self.assertNotEqual(measurement_key(store,candidate,case),key)

