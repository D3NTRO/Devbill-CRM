from pathlib import Path

from .base import *

DEBUG = False
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': Path(__file__).resolve().parent.parent.parent / 'db.sqlite3',
    },
}
