import torch
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments
)
from sklearn.metrics import f1_score, accuracy_score, hamming_loss, precision_score, recall_score


def check_gpu():
    """Check GPU availability"""
    if torch.cuda.is_available():
        print(f"GPU: {torch.cuda.get_device_name(0)}")
        print(f"VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
    else:
        print("WARNING: No GPU available")


def load_model_and_tokenizer():
    """Load PubMedBERT model and tokenizer"""
    model_name = "microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext"

    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(
        model_name,
        num_labels=4,
        problem_type="multi_label_classification"
    )

    print(f"Model loaded: {model.num_parameters():,} parameters")
    return tokenizer, model


def compute_multilabel_metrics(eval_pred):
    """Compute comprehensive multi-label metrics"""
    predictions, labels = eval_pred

    predictions = torch.sigmoid(torch.tensor(predictions))
    predictions = (predictions > 0.5).int().numpy()

    metrics = {
        'f1_macro': f1_score(labels, predictions, average='macro', zero_division=0),
        'f1_micro': f1_score(labels, predictions, average='micro', zero_division=0),
        'f1_weighted': f1_score(labels, predictions, average='weighted', zero_division=0),
        'subset_accuracy': accuracy_score(labels, predictions),
        'hamming_loss': hamming_loss(labels, predictions)
    }

    categories = ['neurological', 'cardiovascular', 'hepatorenal', 'oncological']
    for i, cat in enumerate(categories):
        cat_labels = labels[:, i]
        cat_preds = predictions[:, i]

        metrics[f'f1_{cat}'] = f1_score(cat_labels, cat_preds, zero_division=0)
        metrics[f'precision_{cat}'] = precision_score(cat_labels, cat_preds, zero_division=0)
        metrics[f'recall_{cat}'] = recall_score(cat_labels, cat_preds, zero_division=0)

    return metrics


def get_optimized_training_args():
    """Configuración optimizada para multi-label desbalanceado"""
    return TrainingArguments(
        output_dir='./pubmedbert-medical-v6',

        num_train_epochs=4,
        per_device_train_batch_size=6,
        per_device_eval_batch_size=4,
        gradient_accumulation_steps=4,

        eval_strategy="steps",
        eval_steps=50,
        logging_steps=25,

        fp16=True,
        max_grad_norm=1.0,
        learning_rate=2e-5,
        warmup_ratio=0.1,
        weight_decay=0.1,
        lr_scheduler_type="cosine_with_restarts",

        save_strategy="steps",
        save_steps=50,
        load_best_model_at_end=True,
        metric_for_best_model="f1_macro",
        greater_is_better=True,

        label_smoothing_factor=0.05,

        seed=42,
        report_to="wandb",
        dataloader_num_workers=0,
        remove_unused_columns=False
    )