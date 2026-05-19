from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('client', '0003_expand_client_models'),
    ]

    operations = [
        migrations.AddField(
            model_name='socialmediaaccount',
            name='page_access_token',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='socialmediaaccount',
            name='instagram_business_account_id',
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
