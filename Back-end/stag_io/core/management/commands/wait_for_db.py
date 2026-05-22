"""
Django Command to check if data base is available
"""
import time
from django.core.management.base import BaseCommand
from django.db.utils import OperationalError
from psycopg2 import OperationalError as Psycopg2Error

class Command(BaseCommand):
    """Django command to wait db"""
    def handle(self, *args, **options):
        """Entrypoint for command."""
        self.stdout.write("Wait for Database.")
        db_up= False
        while db_up is False:
            try:
                self.check(databases=['default'])
                db_up=True
            except(OperationalError,Psycopg2Error):
                self.stdout.write("Database unavailable, wating one second ...")
                time.sleep(1)

        self.stdout.write(self.style.SUCCESS('Database available!'))