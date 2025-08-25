import torch
from torch.utils.data import Dataset
from transformers import (
    Trainer,
    default_data_collator
)


class MedicalPapersDataset(Dataset):
    """Custom dataset ensuring correct data types for multi-label classification"""

    def __init__(self, texts, labels, tokenizer, max_length=512):
        self.texts = texts.reset_index(drop=True)
        self.labels = labels.reset_index(drop=True)
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = str(self.texts.iloc[idx])
        labels = self.labels.iloc[idx]

        encoding = self.tokenizer(
            text,
            truncation=True,
            padding='max_length',
            max_length=self.max_length,
            return_tensors='pt'
        )

        return {
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'labels': torch.tensor(labels, dtype=torch.float32)
        }


class ImprovedTrainer(Trainer):
    """Trainer con pérdida BCE ponderada para desbalance de clases"""

    def __init__(self, pos_weights=None, **kwargs):
        super().__init__(**kwargs)
        self.pos_weights = pos_weights.cuda() if pos_weights is not None and torch.cuda.is_available() else pos_weights

    def compute_loss(self, model, inputs, return_outputs=False, **kwargs):
        labels = inputs.pop("labels")
        outputs = model(**inputs)

        if self.pos_weights is not None:
            loss = torch.nn.functional.binary_cross_entropy_with_logits(
                outputs.logits, labels, pos_weight=self.pos_weights
            )
        else:
            loss = torch.nn.functional.binary_cross_entropy_with_logits(
                outputs.logits, labels
            )

        return (loss, outputs) if return_outputs else loss