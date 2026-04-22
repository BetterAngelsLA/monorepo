from sms.capabilities import ContactManager, MessageSender, PhoneValidator, SubscriptionManager


class SmsInterface(MessageSender, ContactManager, SubscriptionManager, PhoneValidator):
    """The full SMS interface.

    Providers implement this directly if they support all capabilities,
    or inherit individual ABCs for partial support.
    """

    pass
