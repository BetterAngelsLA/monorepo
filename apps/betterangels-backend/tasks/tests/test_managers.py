from clients.models import ClientProfile
from common.tests.utils import GraphQLBaseTestCase
from hmis.models import HmisClientProfile
from model_bakery import baker
from tasks.models import Task


class TaskManagerTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.client_profile = baker.make(ClientProfile)
        self.hmis_client_profile = baker.make(HmisClientProfile)

        self.ba_task_1 = baker.make(Task, client_profile=self.client_profile)
        self.hmis_task_1 = baker.make(Task, hmis_client_profile=self.hmis_client_profile)

    def test_tasks_non_hmis_user(self) -> None:
        task_count = Task.objects.count()
        task_ids = set(Task.objects.tasks_for_user(is_hmis_user=False).values_list("id", flat=True))  # type: ignore

        self.assertEqual(task_count, 2)
        self.assertEqual(len(task_ids), 1)
        self.assertIn(self.ba_task_1.id, task_ids)
        self.assertNotIn(self.hmis_task_1.id, task_ids)

    def test_tasks_hmis_user(self) -> None:
        task_count = Task.objects.count()
        task_ids = set(Task.objects.tasks_for_user(is_hmis_user=True).values_list("id", flat=True))  # type: ignore

        self.assertEqual(task_count, 2)
        self.assertEqual(len(task_ids), 1)
        self.assertNotIn(self.ba_task_1.id, task_ids)
        self.assertIn(self.hmis_task_1.id, task_ids)
