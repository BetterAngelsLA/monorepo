from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from django.db import models

    MixinBase = models.Model
else:
    MixinBase = object


class SmartImageSyncMixin(MixinBase):
    """
    Mixin to automatically sync a raw file field to a processed PictureField.
    """

    smart_image_source: str = "file"
    smart_image_target: str = "processed_file"

    def save(self, *args: Any, **kwargs: Any) -> None:
        source = getattr(self, self.smart_image_source, None)
        target = getattr(self, self.smart_image_target, None)

        if source and target is not None:
            if source.name and (not target.name or source.name != target.name):
                target.save(source.name, source.file, save=False)
        super().save(*args, **kwargs)
