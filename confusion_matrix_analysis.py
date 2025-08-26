import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, classification_report
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import pandas as pd
from src.training import MedicalPapersDataset


def create_multilabel_confusion_matrix(model_path, csv_path, sep=";", quotechar='"'):
    """
    Crear matrices de confusión para cada categoría en problema multi-label
    """
    
    print("Cargando modelo entrenado...")
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForSequenceClassification.from_pretrained(model_path)
    model.eval()
    
    print("Cargando datos de validación...")
    df = pd.read_csv(csv_path, sep=sep, quotechar=quotechar, quoting=1)
    
    # Preparar datos igual que en entrenamiento
    from src.data_processing import prepare_medical_dataset_enhanced
    from sklearn.model_selection import train_test_split
    
    df_prepared = prepare_medical_dataset_enhanced(df, apply_augmentation=False)
    df_prepared['label_string'] = df_prepared['labels'].apply(str)
    
    _, val_df = train_test_split(
        df_prepared, 
        test_size=0.2, 
        stratify=df_prepared['label_string'], 
        random_state=42
    )
    
    print(f"Datos de validación: {len(val_df)} muestras")
    
    # Dataset de validación
    val_dataset = MedicalPapersDataset(
        val_df['text'], 
        val_df['labels'], 
        tokenizer, 
        max_length=512
    )
    
    # Obtener predicciones
    print("Generando predicciones...")
    all_predictions = []
    all_labels = []
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model.to(device)
    
    with torch.no_grad():
        for i in range(len(val_dataset)):
            sample = val_dataset[i]
            
            # Preparar input
            input_ids = sample['input_ids'].unsqueeze(0).to(device)
            attention_mask = sample['attention_mask'].unsqueeze(0).to(device)
            
            # Predicción
            outputs = model(input_ids=input_ids, attention_mask=attention_mask)
            logits = outputs.logits
            
            # Convertir a probabilidades y predicciones binarias
            probs = torch.sigmoid(logits)
            predictions = (probs > 0.5).int().cpu().numpy()[0]
            
            all_predictions.append(predictions)
            all_labels.append(sample['labels'].numpy())
    
    all_predictions = np.array(all_predictions)
    all_labels = np.array(all_labels)
    
    categories = ['Neurological', 'Cardiovascular', 'Hepatorenal', 'Oncological']
    
    # Crear matrices de confusión individuales
    fig, axes = plt.subplots(2, 2, figsize=(15, 12))
    fig.suptitle('Matrices de Confusión por Categoría Médica', fontsize=16, fontweight='bold')
    
    axes = axes.flatten()
    
    for i, category in enumerate(categories):
        # Matriz de confusión para esta categoría
        cm = confusion_matrix(all_labels[:, i], all_predictions[:, i])
        
        # Plotting
        sns.heatmap(
            cm, 
            annot=True, 
            fmt='d', 
            cmap='Blues',
            xticklabels=['No', 'Yes'],
            yticklabels=['No', 'Yes'],
            ax=axes[i]
        )
        
        axes[i].set_title(f'{category}', fontweight='bold')
        axes[i].set_xlabel('Predicted')
        axes[i].set_ylabel('Actual')
        
        # Calcular métricas
        tn, fp, fn, tp = cm.ravel()
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        
        # Añadir métricas como texto
        metrics_text = f'Precision: {precision:.3f}\nRecall: {recall:.3f}\nF1-Score: {f1:.3f}'
        axes[i].text(0.02, 0.98, metrics_text, transform=axes[i].transAxes, 
                    verticalalignment='top', bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
    
    plt.tight_layout()
    plt.show()
    
    # Reporte detallado
    print("\n" + "="*80)
    print("REPORTE DETALLADO POR CATEGORÍA")
    print("="*80)
    
    for i, category in enumerate(categories):
        print(f"\n📊 {category.upper()}:")
        print(classification_report(
            all_labels[:, i], 
            all_predictions[:, i], 
            target_names=['No', 'Yes'],
            digits=4
        ))
    
    return all_predictions, all_labels


def create_subset_accuracy_analysis(predictions, labels):
    """
    Análisis de accuracy por combinaciones de etiquetas (subset accuracy)
    """
    categories = ['Neurological', 'Cardiovascular', 'Hepatorenal', 'Oncological']
    
    print("\n" + "="*80)
    print("ANÁLISIS DE COMBINACIONES DE ETIQUETAS")
    print("="*80)
    
    # Convertir a strings para comparación
    true_combinations = []
    pred_combinations = []
    
    for i in range(len(labels)):
        true_combo = '|'.join([categories[j] for j in range(4) if labels[i][j] == 1])
        pred_combo = '|'.join([categories[j] for j in range(4) if predictions[i][j] == 1])
        
        true_combinations.append(true_combo if true_combo else 'None')
        pred_combinations.append(pred_combo if pred_combo else 'None')
    
    # Subset accuracy (predicción exacta)
    exact_matches = sum(1 for t, p in zip(true_combinations, pred_combinations) if t == p)
    subset_accuracy = exact_matches / len(labels)
    
    print(f"Subset Accuracy (predicción exacta): {subset_accuracy:.4f}")
    print(f"Coincidencias exactas: {exact_matches}/{len(labels)}")
    
    # Análisis por tipo de combinación
    combo_analysis = {}
    for true_combo, pred_combo in zip(true_combinations, pred_combinations):
        if true_combo not in combo_analysis:
            combo_analysis[true_combo] = {'total': 0, 'correct': 0}
        combo_analysis[true_combo]['total'] += 1
        if true_combo == pred_combo:
            combo_analysis[true_combo]['correct'] += 1
    
    print(f"\nAccuracy por tipo de combinación:")
    for combo, stats in sorted(combo_analysis.items(), key=lambda x: x[1]['total'], reverse=True):
        accuracy = stats['correct'] / stats['total']
        print(f"  {combo:35}: {stats['correct']:3d}/{stats['total']:3d} = {accuracy:.3f}")


def analyze_prediction_errors(predictions, labels, val_df):
    """
    Análisis detallado de errores de predicción
    """
    categories = ['Neurological', 'Cardiovascular', 'Hepatorenal', 'Oncological']
    
    print("\n" + "="*80)
    print("ANÁLISIS DE ERRORES")
    print("="*80)
    
    # Encontrar muestras con errores
    errors = []
    
    for i in range(len(predictions)):
        if not np.array_equal(predictions[i], labels[i]):
            error_info = {
                'index': i,
                'text': val_df.iloc[i]['text'][:100] + "...",
                'true_labels': [categories[j] for j in range(4) if labels[i][j] == 1],
                'pred_labels': [categories[j] for j in range(4) if predictions[i][j] == 1],
                'error_type': []
            }
            
            # Clasificar tipos de error
            for j in range(4):
                if labels[i][j] == 1 and predictions[i][j] == 0:
                    error_info['error_type'].append(f"Missed {categories[j]}")
                elif labels[i][j] == 0 and predictions[i][j] == 1:
                    error_info['error_type'].append(f"False {categories[j]}")
            
            errors.append(error_info)
    
    print(f"Total de errores: {len(errors)} de {len(predictions)} ({len(errors)/len(predictions)*100:.1f}%)")
    
    # Mostrar algunos ejemplos de errores
    print(f"\nPrimeros 5 errores:")
    for i, error in enumerate(errors[:5]):
        print(f"\n--- Error {i+1} ---")
        print(f"Texto: {error['text']}")
        print(f"Etiquetas reales: {error['true_labels']}")
        print(f"Etiquetas predichas: {error['pred_labels']}")
        print(f"Tipos de error: {error['error_type']}")


if __name__ == "__main__":
    # Usar el modelo entrenado
    model_path = "./pubmedbert-medical-v6"
    csv_path = "challenge_data-18-ago.csv"
    
    print("Iniciando análisis de matrices de confusión...")
    
    predictions, labels = create_multilabel_confusion_matrix(model_path, csv_path)
    create_subset_accuracy_analysis(predictions, labels)
    
    # Para análisis de errores necesitamos los datos de validación
    print("\nAnálisis de errores disponible - ejecutar analyze_prediction_errors() si es necesario")