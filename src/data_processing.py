import pandas as pd
import numpy as np


def prepare_medical_dataset_enhanced(df, apply_augmentation=True):
    """Tu función prepare_medical_dataset pero con augmentation mejorada"""
    from augmentation import augment_multilabel_with_real_patterns, create_targeted_synthetic_samples

    category_mapping = {
        'neurological': 0,
        'cardiovascular': 1,
        'hepatorenal': 2,
        'oncological': 3
    }

    def parse_medical_labels(group_str):
        labels = [0, 0, 0, 0]
        if pd.isna(group_str):
            return labels
        categories = str(group_str).split('|')
        for cat in categories:
            cat = cat.strip().lower()
            if cat in category_mapping:
                labels[category_mapping[cat]] = 1
        return labels

    df['text'] = df['title'].astype(str) + " [SEP] " + df['abstract'].astype(str)
    df['labels'] = df['group'].apply(parse_medical_labels)

    if apply_augmentation:
        print("Aplicando data augmentation específica para multi-label...")
        df = augment_multilabel_with_real_patterns(df, target_samples=35)

        print("Creando muestras sintéticas para combinaciones críticas...")
        synthetic_samples = create_targeted_synthetic_samples(df, ['all_four', 'cardio_renal_onco'])
        if synthetic_samples:
            synthetic_df = pd.DataFrame(synthetic_samples)
            df = pd.concat([df, synthetic_df], ignore_index=True)
            print(f"Añadidas {len(synthetic_samples)} muestras sintéticas dirigidas")

    categories = ['neurological', 'cardiovascular', 'hepatorenal', 'oncological']
    print("\nDistribución final de etiquetas:")
    for i, cat in enumerate(categories):
        count = sum(1 for labels in df['labels'] if labels[i] == 1)
        percentage = (count / len(df)) * 100
        print(f"  {cat:15}: {count:4d} samples ({percentage:5.1f}%)")

    df['num_labels'] = df['labels'].apply(lambda x: sum(x))
    multilabel_count = sum(1 for num in df['num_labels'] if num > 1)
    print(f"\nMuestras multi-label: {multilabel_count} ({multilabel_count/len(df)*100:.1f}%)")

    return df[['text', 'labels']].copy()


def analyze_text_lengths(df, tokenizer):
    """Analyze text lengths for optimal max_length"""
    lengths = df['text'].apply(lambda x: len(tokenizer.encode(str(x))))

    print(f"\nText length analysis:")
    print(f"  Mean: {lengths.mean():.0f} tokens")
    print(f"  95th percentile: {lengths.quantile(0.95):.0f} tokens")
    print(f"  Max: {lengths.max():.0f} tokens")

    optimal_length = min(512, int(lengths.quantile(0.95)))
    print(f"  Recommended max_length: {optimal_length}")

    return optimal_length


def calculate_class_weights(df):
    """Calcula pesos para balancear clases automáticamente"""
    import torch
    
    labels_array = np.array(df['labels'].tolist())
    pos_counts = labels_array.sum(axis=0)
    neg_counts = len(labels_array) - pos_counts

    pos_weights = neg_counts / np.maximum(pos_counts, 1)
    pos_weights = np.clip(pos_weights, 0.1, 10.0)

    categories = ['neurological', 'cardiovascular', 'hepatorenal', 'oncological']
    print("\nPesos calculados para balancear clases:")
    for i, (cat, weight) in enumerate(zip(categories, pos_weights)):
        freq = pos_counts[i] / len(df) * 100
        print(f"  {cat:15}: peso {weight:.2f} (frecuencia: {freq:.1f}%)")

    return torch.tensor(pos_weights, dtype=torch.float32)