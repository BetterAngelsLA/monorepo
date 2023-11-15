"""
Django settings for betterangels_backend project.

Generated by 'django-admin startproject' using Django 4.2.4.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.2/ref/settings/
"""


import os
from pathlib import Path
from typing import List

import django_stubs_ext
import environ  # type: ignore

django_stubs_ext.monkeypatch()


env = environ.Env(
    ACCOUNT_DEFAULT_HTTP_PROTOCOL=(str, "http"),
    ALLOWED_HOSTS=(list, []),
    AWS_REGION=(str, "us-west-2"),
    AWS_SES_REGION_NAME=(str, ""),
    AWS_SES_REGION_ENDPOINT=(str, "email.us-west-2.amazonaws.com"),
    CELERY_BROKER_URL=(str, ""),
    CELERY_REDBEAT_REDIS_URL=(str, ""),
    CONN_MAX_AGE=(int, 300),
    CSRF_TRUSTED_ORIGINS=(list, []),
    CSRF_COOKIE_SECURE=(bool, True),
    CORS_ALLOW_ALL_ORIGINS=(bool, False),
    CORS_ALLOWED_ORIGINS=(list, []),
    DEBUG=(bool, False),
    DJANGO_CACHE_URL=(str, ""),
    IS_LOCAL_DEV=(bool, False),
    LANGUAGE_COOKIE_SECURE=(bool, True),
    POST_OFFICE_EMAIL_BACKEND=(str, ""),
    POSTGRES_NAME=(str, "postgres"),
    POSTGRES_USER=(str, "postgres"),
    POSTGRES_PASSWORD=(str, "postgres"),
    POSTGRES_HOST=(str, "db"),
    SECRET_KEY=(str, "secret_key"),
    SESSION_COOKIE_AGE=(int, 1209600),  # Defaults to two weeks in seconds
    SESSION_COOKIE_SECURE=(bool, True),
    SESSION_COOKIE_HTTPONLY=(bool, True),
    SECURE_HSTS_INCLUDE_SUBDOMAINS=(bool, False),
    SECURE_HSTS_PRELOAD=(bool, False),
    SECURE_HSTS_SECONDS=(int, 0),
    SOCIALACCOUNT_GOOGLE_CLIENT_ID=(str, ""),
    SOCIALACCOUNT_GOOGLE_SECRET=(str, ""),
    USE_IAM_AUTH=(bool, False),
    SESAME_TOKEN_NAME=(str, "token"),
    SESAME_MAX_AGE=(int, 60 * 60),  # set to 1 hr
    SESAME_ONE_TIME=(bool, True),
    SESAME_SALT=(str, "sesame"),
)

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

if env("IS_LOCAL_DEV"):
    environ.Env.read_env(env_file=os.path.join(BASE_DIR, ".env"))

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/
SECRET_KEY = env("SECRET_KEY")
DEBUG = env("DEBUG")

# Application definition
INSTALLED_APPS = [
    "jazzmin",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",
    "django_extensions",
    # 3rd Party
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
    "corsheaders",
    "dj_rest_auth",
    "dj_rest_auth.registration",
    "post_office",
    "rest_framework",
    "organizations",
    "simple_history",
    # Our Apps
    "accounts",
    "dwelling",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "simple_history.middleware.HistoryRequestMiddleware",
    "allauth.account.middleware.AccountMiddleware",
]


# Provider specific settings
SOCIALACCOUNT_PROVIDERS = {
    "google": {
        "SCOPE": ["profile", "email"],
        "EMAIL_AUTHENTICATION": True,
        # For each OAuth based provider, either add a ``SocialApp``
        # (``socialaccount`` app) containing the required client
        # credentials, or list them here:
        "APP": {
            "client_id": env("SOCIALACCOUNT_GOOGLE_CLIENT_ID"),
            "secret": env("SOCIALACCOUNT_GOOGLE_SECRET"),
            "key": "",
        },
        "AUTH_PARAMS": {
            "access_type": "online",
        },
        "OAUTH_PKCE_ENABLED": True,
    }
}

ROOT_URLCONF = "betterangels_backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [
            os.path.normpath(os.path.join(BASE_DIR, "templates")),
        ],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "django.template.context_processors.request",
            ],
        },
    }
]

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    # `allauth` specific authentication methods, such as login by email
    "allauth.account.auth_backends.AuthenticationBackend",
    "sesame.backends.ModelBackend",
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework.authentication.SessionAuthentication",
    ),
    # Tokens by default are not unique accross devices.
    # We want to use session auth by default for now.
    "TOKEN_CREATOR": None,
    "TOKEN_MODEL": None,
}

WSGI_APPLICATION = "betterangels_backend.wsgi.application"

# Celery
CELERY_BROKER_URL = env("CELERY_BROKER_URL")
CELERY_REDBEAT_REDIS_URL = env("CELERY_REDBEAT_REDIS_URL")

# Caches
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": env("DJANGO_CACHE_URL"),
    }
}


# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases
DATABASES = {
    "default": {
        "ENGINE": "backends.iam_dbauth.postgis",
        "NAME": env("POSTGRES_NAME"),
        "USER": env("POSTGRES_USER"),
        "PASSWORD": env("POSTGRES_PASSWORD"),
        "HOST": env("POSTGRES_HOST"),
        "PORT": "5432",
        "CONN_MAX_AGE": env("CONN_MAX_AGE"),
        "IAM_SETTINGS": {
            "ENABLED": env("USE_IAM_AUTH"),
            "REGION_NAME": env("AWS_REGION"),
        },
    }
}

AUTH_USER_MODEL = "accounts.User"

# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",  # noqa: B950
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

LOGIN_REDIRECT_URL = "home"
LOGOUT_REDIRECT_URL = "home"
LOGIN_URL = "/accounts/login/"

# django-organizations settings
ORGS_SLUGFIELD = "django_extensions.db.fields.AutoSlugField"


# ALL AUTH SETTINGS
ACCOUNT_EMAIL_CONFIRMATION_EXPIRE_DAYS = 7
"""
ACCOUNT_EMAIL_REQUIRED (default: False)
The user is required to hand over an email address when signing up.
"""
# ACCOUNT_EMAIL_REQUIRED = True
"""
ACCOUNT_EMAIL_VERIFICATION (default: "optional")
Determines the email verification method during signup 
– choose one of "mandatory", "optional", or "none".

Setting this to "mandatory" requires ACCOUNT_EMAIL_REQUIRED to be True.

When set to "mandatory" the user is blocked
from logging in until the email address is
verified. Choose "optional"
or "none" to allow logins with an unverified
email address. In case of "optional", the email verification mail is
still sent, whereas in case of “none” no email verification mails are sent.
"""
# ACCOUNT_EMAIL_VERIFICATION = "mandatory"

# EMAIL Backend
AWS_SES_REGION_NAME = env("AWS_SES_REGION_NAME") or env("AWS_REGION")
AWS_SES_REGION_ENDPOINT = env("AWS_SES_REGION_ENDPOINT")
USE_SES_V2 = True

EMAIL_BACKEND = "post_office.EmailBackend"
POST_OFFICE = {
    "BACKENDS": {
        "default": env("POST_OFFICE_EMAIL_BACKEND"),
    },
    "CELERY_ENABLED": True,
}
EMAIL_FILE_PATH = "./tmp/app-emails"  # change this to your preferred location
INVITATION_BACKEND = "accounts.backends.CustomInvitations"


SITE_ID = 1

ACCOUNT_DEFAULT_HTTP_PROTOCOL = env("ACCOUNT_DEFAULT_HTTP_PROTOCOL")
ALLOWED_HOSTS: List[str] = env("ALLOWED_HOSTS")
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = env("CORS_ALLOW_ALL_ORIGINS")
CORS_ALLOWED_ORIGINS = env("CORS_ALLOWED_ORIGINS")
CSRF_COOKIE_SECURE = env("CSRF_COOKIE_SECURE")
CSRF_TRUSTED_ORIGINS = env("CSRF_TRUSTED_ORIGINS")
LANGUAGE_COOKIE_SECURE = env("LANGUAGE_COOKIE_SECURE")
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_HTTPONLY = env("SESSION_COOKIE_HTTPONLY")
SESSION_COOKIE_AGE = env("SESSION_COOKIE_AGE")
SESSION_COOKIE_SECURE = env("SESSION_COOKIE_SECURE")
SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_SAVE_EVERY_REQUEST = True
SECURE_HSTS_INCLUDE_SUBDOMAINS = env("SECURE_HSTS_INCLUDE_SUBDOMAINS")
SECURE_HSTS_PRELOAD = env("SECURE_HSTS_PRELOAD")
SECURE_HSTS_SECONDS = env("SECURE_HSTS_SECONDS")

# Django Sesame settings
SESAME_TOKEN_NAME = env("SESAME_TOKEN_NAME")
SESAME_MAX_AGE = env("SESAME_MAX_AGE")
SESAME_ONE_TIME = env("SESAME_ONE_TIME")
SESAME_SALT = env("SESAME_SALT")
