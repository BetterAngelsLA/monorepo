import strawberry
from django.db import models
from django.utils.translation import gettext_lazy as _


class MoodEnum(models.TextChoices):
    AGITATED = "agitated", _("Agitated")
    AGREEABLE = "agreeable", _("Agreeable")
    ANXIOUS = "anxious", _("Anxious")
    DEPRESSED = "depressed", _("Depressed")
    DETACHED = "detached", _("Detached")
    DISORGANIZED_THOUGHT = "disorganized_thought", _("Disorganized Thought")
    DISORIENTED = "disoriented", _("Disoriented")
    ESCALATED = "escalated", _("Escalated")
    EUTHYMIC = "euthymic", _("Euthymic")
    FLAT_BLUNTED = "flat_blunted", _("Flat/blunted")
    HAPPY = "happy", _("Happy")
    HOPELESS = "hopeless", _("Hopeless")
    INDIFFERENT = "indifferent", _("Indifferent")
    MANIC = "manic", _("Manic")
    MOTIVATED = "motivated", _("Motivated")
    OPTIMISTIC = "optimistic", _("Optimistic")
    PERSONABLE = "personable", _("Personable")
    PLEASANT = "pleasant", _("Pleasant")
    RESTLESS = "restless", _("Restless")
    SUICIDAL = "suicidal", _("Suicidal")


@strawberry.enum
class NoteNamespaceEnum(models.TextChoices):
    MOOD_ASSESSMENT = "mood_assessment", "Mood Assessment"
    PROVIDED_SERVICES = "provided_services", "Provided Services"
    REQUESTED_SERVICES = "requested_services", "Requested Services"


class ServiceEnum(models.TextChoices):
    BICYCLE = "bicycle", _("Bicycle")
    BIRTH_CERTIFICATE = "birth_certificate", _("Birth Certificate")
    BLANKET = "blanket", _("Blanket")
    BOOK = "book", _("Book")
    CALIFORNIA_LIFELINE_PHONE = "california_lifeline_phone", _("California Lifeline Phone")
    CLOTHES = "clothes", _("Clothes")
    CONTACT_DPSS = "contact_dpss", _("Contact DPSS")
    CONTACT_FRIEND = "contact_friend", _("Contact Friend")
    DMH_EVALUATION = "dmh_evaluation", _("DMH Evaluation")
    DMV_NO_FEE_ID_FORM = "dmv_no_fee_id_form", _("DMV No Fee ID Form")
    DENTAL = "dental", _("Dental")
    DISCOUNT_SCOOTER_RIDES = "discount_scooter_rides", _("Discount Scooter Rides")
    FAMILY_REUNIFICATION = "family_reunification", _("Family Reunification")
    FOOD = "food", _("Food")
    HARM_REDUCTION = "harm_reduction", _("Harm Reduction")
    HYGIENE_KIT = "hygiene_kit", _("Hygiene Kit")
    INTERNET_ACCESS = "internet_access", _("Internet Access")
    LEGAL_COUNSEL = "legal_counsel", _("Legal Counsel")
    MAIL_PICK_UP = "mail_pick_up", _("Mail Pick Up")
    MEDICAL = "medical", _("Medical")
    METRO_LIFE_TAP = "metro_life_tap", _("Metro LIFE Tap")
    PET_CARE = "pet_care", _("Pet Care")
    PET_FOOD = "pet_food", _("Pet Food")
    PUBLIC_BENEFITS_PROGRAMS = "public_benefits_programs", _("Public Benefits Programs")
    RIDE = "ride", _("Ride")
    SAFE_PARKING = "safe_parking", _("Safe Parking")
    SHELTER = "shelter", _("Shelter")
    SHOES = "shoes", _("Shoes")
    SHOWER = "shower", _("Shower")
    SOCIAL_SECURITY_CARD_REPLACEMENT = "social_security_card_replacement", _("Social Security Card Replacement")
    STABILIZE = "stabilize", _("Stabilize")  # TODO: remove once fe has been updated
    STIMULUS_ASSISTANCE = "stimulus_assistance", _("Stimulus Assistance")
    STORAGE = "storage", _("Storage")  # TODO: remove once fe has been updated
    STORAGE_BELONGINGS = "storage_belongings", _("Storage - Belongings")
    STORAGE_DOCUMENTS = "storage_documents", _("Storage - Documents")
    TENT = "tent", _("Tent")
    THERAPIST_APPOINTMENT = "therapist_appointment", _("Therapist Appointment")
    TRANSPORT = "transport", _("Transport")  # TODO: remove once fe has been updated
    UNEMPLOYMENT_CERTIFICATION = "unemployment_certification", _("Unemployment Certification")
    VACCINE_PASSPORT = "vaccine_passport", _("Vaccine Passport")
    WATER = "water", _("Water")
    OTHER = "other", _("Other")


class TaskStatusEnum(models.TextChoices):
    COMPLETED = "completed", _("Completed")
    TO_DO = "to_do", _("To Do")


class ServiceRequestStatusEnum(models.TextChoices):
    COMPLETED = "completed", _("Completed")
    TO_DO = "to_do", _("To Do")


@strawberry.enum
class TaskTypeEnum(models.TextChoices):
    PURPOSE = "purpose", "Purpose"
    NEXT_STEP = "next_step", "Next Step"


@strawberry.enum
class ServiceRequestTypeEnum(models.TextChoices):
    PROVIDED = "provided", "Provided"
    REQUESTED = "requested", "Requested"


@strawberry.enum
class DueByGroupEnum(models.TextChoices):
    OVERDUE = "overdue", _("Overdue")
    TODAY = "today", _("Today")
    TOMORROW = "tomorrow", _("Tomorrow")
    IN_THE_NEXT_WEEK = "in_the_next_week", _("In the next week")
    FUTURE_TASKS = "future_tasks", _("Future tasks")
    NO_DUE_DATE = "no_due_date", _("No due date")
