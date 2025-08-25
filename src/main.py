import pandas as pd
import torch
import warnings
from sklearn.model_selection import train_test_split
from transformers import default_data_collator

from model_utils import (
    check_gpu,
    load_model_and_tokenizer, 
    compute_multilabel_metrics,
    get_optimized_training_args
)
from data_processing import (
    prepare_medical_dataset_enhanced,
    calculate_class_weights
)
from training import MedicalPapersDataset, ImprovedTrainer
from prediction import predict_medical_categories

warnings.filterwarnings("ignore")


def train_optimized_medical_classifier(csv_path, sep=";", quotechar='"'):
    """
    Función principal optimizada para resolver el problema de multi-label desbalanceado
    """

    print("=== ENTRENAMIENTO OPTIMIZADO PARA MULTI-LABEL ===")
    check_gpu()

    print(f"\nCargando datos desde {csv_path}")
    df = pd.read_csv(csv_path, sep=sep, quotechar=quotechar, quoting=1)
    print(f"Cargados {len(df):,} samples")

    print("\nCargando PubMedBERT model...")
    tokenizer, model = load_model_and_tokenizer()

    print("\nPreparando dataset con optimizaciones...")
    df_prepared = prepare_medical_dataset_enhanced(df, apply_augmentation=True)

    print("\nCalculando pesos para balancear clases...")
    class_weights = calculate_class_weights(df_prepared)

    optimal_max_length = 512

    print("\nDividiendo datos con estratificación...")
    df_prepared['label_string'] = df_prepared['labels'].apply(str)
    train_df, val_df = train_test_split(
        df_prepared,
        test_size=0.2,
        stratify=df_prepared['label_string'],
        random_state=42
    )
    print(f"   Train: {len(train_df):,} samples")
    print(f"   Validation: {len(val_df):,} samples")

    val_multilabel = sum(1 for labels in val_df['labels'] if sum(labels) > 1)
    print(f"   Multi-label en validation: {val_multilabel} ({val_multilabel/len(val_df)*100:.1f}%)")

    print("\nCreando datasets optimizados...")
    train_dataset = MedicalPapersDataset(
        train_df['text'], train_df['labels'], tokenizer, optimal_max_length
    )
    val_dataset = MedicalPapersDataset(
        val_df['text'], val_df['labels'], tokenizer, optimal_max_length
    )

    sample = train_dataset[0]
    assert sample['labels'].dtype == torch.float32, "Labels deben ser float32"
    print("Formato de datos verificado")

    training_args = get_optimized_training_args()

    print("\nConfigurando trainer optimizado...")
    trainer = ImprovedTrainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        tokenizer=tokenizer,
        data_collator=default_data_collator,
        compute_metrics=compute_multilabel_metrics,
        pos_weights=class_weights
    )

    print(f"\nIniciando entrenamiento optimizado...")
    print(f"   Configuración:")
    print(f"      - Epochs: {training_args.num_train_epochs}")
    print(f"      - Batch efectivo: {training_args.per_device_train_batch_size * training_args.gradient_accumulation_steps}")
    print(f"      - Learning rate: {training_args.learning_rate}")
    print(f"      - Weight decay: {training_args.weight_decay}")
    print(f"      - Max length: {optimal_max_length}")
    print(f"      - Samples totales: {len(train_df):,}")

    train_result = trainer.train()

    print("\nEvaluación final...")
    final_metrics = trainer.evaluate()

    print(f"\n¡ENTRENAMIENTO COMPLETADO!")
    print(f"\nMétricas principales:")
    key_metrics = {
        'eval_f1_macro': 'F1 Macro',
        'eval_f1_micro': 'F1 Micro',
        'eval_f1_weighted': 'F1 Weighted',
        'eval_subset_accuracy': 'Subset Accuracy',
        'eval_hamming_loss': 'Hamming Loss'
    }

    for metric_key, metric_name in key_metrics.items():
        if metric_key in final_metrics:
            value = final_metrics[metric_key]
            print(f"   {metric_name:15}: {value:.4f}")

    print(f"\nF1 Score por categoría:")
    categories = ['neurological', 'cardiovascular', 'hepatorenal', 'oncological']
    for cat in categories:
        f1_key = f'eval_f1_{cat}'
        if f1_key in final_metrics:
            print(f"   {cat:15}: {final_metrics[f1_key]:.4f}")

    model_path = "./pubmedbert-medical-v6"
    trainer.save_model(model_path)
    tokenizer.save_pretrained(model_path)
    print(f"\nModelo guardado en: {model_path}")

    return trainer, final_metrics


if __name__ == "__main__":
    print("Iniciando pipeline completo de optimización...")
    
    csv_file = "../challenge_data-18-ago.csv"
    trainer, metrics = train_optimized_medical_classifier(csv_file)