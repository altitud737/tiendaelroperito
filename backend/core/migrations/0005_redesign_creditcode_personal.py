"""
Redesign CreditCode: personal codes assigned to specific users.
- Remove CreditCodeRedemption table
- Remove old fields (max_usos, usos_actuales, activo, fecha_expiracion)
- Add usuario FK, usado, fecha_uso
"""
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_creditcode_creditcoderedemption'),
    ]

    operations = [
        # 1. Drop CreditCodeRedemption table
        migrations.DeleteModel(
            name='CreditCodeRedemption',
        ),
        # 2. Remove old fields from CreditCode
        migrations.RemoveField(
            model_name='creditcode',
            name='max_usos',
        ),
        migrations.RemoveField(
            model_name='creditcode',
            name='usos_actuales',
        ),
        migrations.RemoveField(
            model_name='creditcode',
            name='activo',
        ),
        migrations.RemoveField(
            model_name='creditcode',
            name='fecha_expiracion',
        ),
        # 3. Add new fields
        migrations.AddField(
            model_name='creditcode',
            name='usado',
            field=models.BooleanField(default=False, verbose_name='usado'),
        ),
        migrations.AddField(
            model_name='creditcode',
            name='fecha_uso',
            field=models.DateTimeField(blank=True, null=True, verbose_name='fecha de uso'),
        ),
        migrations.AddField(
            model_name='creditcode',
            name='usuario',
            field=models.ForeignKey(
                default=1,  # temporary default, table is empty
                on_delete=django.db.models.deletion.CASCADE,
                related_name='codigos_credito',
                to=settings.AUTH_USER_MODEL,
                verbose_name='usuario asignado',
            ),
            preserve_default=False,
        ),
    ]
