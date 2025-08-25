import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification


def predict_medical_categories(text, model_path="./pubmedbert-medical-v6", threshold=0.25):
    categories = ['neurological', 'cardiovascular', 'hepatorenal', 'oncological']

    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForSequenceClassification.from_pretrained(model_path)

    inputs = tokenizer(
        text,
        return_tensors='pt',
        truncation=True,
        padding=True,
        max_length=512
    )

    model.eval()
    with torch.no_grad():
        outputs = model(**inputs)
        predictions = torch.sigmoid(outputs.logits)[0]

    results = []
    for i, (category, prob) in enumerate(zip(categories, predictions)):
        results.append({
            'category': category,
            'probability': prob.item(),
            'predicted': prob.item() > threshold
        })

    return results