from django.urls import path
from .views import CreditHistoryView, MyCodesView, RedeemCreditCodeView

urlpatterns = [
    path('history/', CreditHistoryView.as_view(), name='credit-history'),
    path('my-codes/', MyCodesView.as_view(), name='credit-my-codes'),
    path('redeem/', RedeemCreditCodeView.as_view(), name='credit-redeem'),
]
