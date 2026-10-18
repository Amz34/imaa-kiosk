# إيماء (Imaa) — Top 50 MVP Vocabulary

Every sign is tagged with speech-act class so the sentence builder knows the
grammar role (symptom / request / admin). `code` is what the model predicts;
the three strings are what the world reads.

## A. Triage & Medical (25)

| # | code | en | ar | ur | class |
|---|------|----|----|----|-------|
| 1 | PAIN | Pain | ألم | درد | symptom |
| 2 | FEVER | Fever | حمى | بخار | symptom |
| 3 | CHEST_PAIN | Chest pain | ألم في الصدر | سینے میں درد | symptom |
| 4 | BREATHING | Difficulty breathing | صعوبة التنفس | سانس لینے میں دشواری | symptom |
| 5 | HEADACHE | Headache | صداع | سر درد | symptom |
| 6 | DIZZY | Dizziness | دوار | چکر | symptom |
| 7 | NAUSEA | Nausea | غثيان | متلی | symptom |
| 8 | INJURY | Injury | إصابة | چوٹ | symptom |
| 9 | ALLERGY | Allergy | حساسية | الرجی | symptom |
| 10 | BLOOD | Blood | دم | خون | symptom |
| 11 | BLOOD_PRESSURE | Blood pressure | ضغط الدم | بلڈ پریشر | condition |
| 12 | DIABETES | Diabetes | سكري | ذیابیطس | condition |
| 13 | PREGNANT | Pregnant | حامل | حاملہ | condition |
| 14 | DOCTOR | Doctor | طبيب | ڈاکٹر | person |
| 15 | NURSE | Nurse | ممرضة | نرس | person |
| 16 | HOSPITAL | Hospital | مستشفى | ہسپتال | place |
| 17 | EMERGENCY | Emergency | طوارئ | ایمرجنسی | request |
| 18 | AMBULANCE | Ambulance | إسعاف | ایمبولینس | request |
| 19 | MEDICINE | Medicine | دواء | دوا | request |
| 20 | PHARMACY | Pharmacy | صيدلية | فارمیسی | place |
| 21 | INJECTION | Injection | إبرة | انجیکشن | request |
| 22 | XRAY | X-ray | أشعة | ایکس رے | request |
| 23 | SURGERY | Surgery | عملية جراحية | آپریشن | request |
| 24 | INSURANCE | Insurance | تأمين | انشورنس | admin |
| 25 | WHEELCHAIR | Wheelchair | كرسي متحرك | وہیل چیئر | request |

## B. Government & Administrative (25)

| # | code | en | ar | ur | class |
|---|------|----|----|----|-------|
| 26 | YES | Yes | نعم | ہاں | answer |
| 27 | NO | No | لا | نہیں | answer |
| 28 | HELP | Help | مساعدة | مدد | request |
| 29 | THANK_YOU | Thank you | شكراً | شکریہ | courtesy |
| 30 | PLEASE | Please | من فضلك | برائے مہربانی | courtesy |
| 31 | WAIT | Wait | انتظر | انتظار کریں | request |
| 32 | ID_IQAMA | ID / Iqama | هوية / إقامة | اقامہ | document |
| 33 | PASSPORT | Passport | جواز سفر | پاسپورٹ | document |
| 34 | SIGNATURE | Signature | توقيع | دستخط | document |
| 35 | FORM | Form | نموذج | فارم | document |
| 36 | PAY | Pay | دفع | ادائیگی | action |
| 37 | BANK | Bank | بنك | بینک | place |
| 38 | POLICE | Police | شرطة | پولیس | place |
| 39 | FIRE | Fire | حريق | آگ | emergency |
| 40 | TRANSLATE | Translate | ترجمة | ترجمہ | request |
| 41 | REPEAT | Repeat | إعادة | دوبارہ | request |
| 42 | SLOW | Slower | ببطء | آہستہ | request |
| 43 | CORRECT | Correct | صحيح | صحیح | answer |
| 44 | WRONG | Wrong | خطأ | غلط | answer |
| 45 | NAME | Name | اسم | نام | data |
| 46 | PHONE | Phone number | هاتف | فون | data |
| 47 | LOCATION | Location | موقع | مقام | data |
| 48 | DATE | Date | تاريخ | تاریخ | data |
| 49 | TIME | Time | وقت | وقت | data |
| 50 | FINISHED | Finished | انتهى | مکمل | answer |

## Grammar contract

The translator never emits free-form text. It emits a **speech act** drawn from
this table, and the sentence builder renders it per language. That is why
"reviewed output" is a real guarantee and not a hope: the model chooses among
50 reviewed meanings, not among infinite sentences.
