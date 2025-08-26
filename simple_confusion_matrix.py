import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification


def quick_confusion_matrix(model_path="./pubmedbert-medical-v6"):
    """
    Función rápida para generar matrices de confusión
    Usa los datos que ya tienes en el entrenador
    """
    
    print("🔍 Cargando modelo para evaluación...")
    
    # Cargar modelo
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForSequenceClassification.from_pretrained(model_path)
    
    # Si ya tienes un trainer guardado, puedes usar:
    # predictions = trainer.predict(val_dataset)
    
    print("💡 Para usar esta función necesitas:")
    print("1. Tener el trainer ya entrenado")
    print("2. O cargar datos de validación")
    print("\nEjemplo de uso con trainer existente:")
    
    example_code = '''
# Después del entrenamiento en main.py, añadir:

# Obtener predicciones del conjunto de validación
predictions = trainer.predict(val_dataset)
pred_labels = (torch.sigmoid(torch.tensor(predictions.predictions)) > 0.5).int().numpy()
true_labels = predictions.label_ids

# Crear matrices de confusión
categories = ['Neurological', 'Cardiovascular', 'Hepatorenal', 'Oncological']

fig, axes = plt.subplots(2, 2, figsize=(12, 10))
axes = axes.flatten()

for i, category in enumerate(categories):
    cm = confusion_matrix(true_labels[:, i], pred_labels[:, i])
    
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=['No', 'Yes'], yticklabels=['No', 'Yes'],
                ax=axes[i])
    axes[i].set_title(f'{category}')
    axes[i].set_xlabel('Predicted')
    axes[i].set_ylabel('Actual')

plt.tight_layout()
plt.show()
'''
    
    print(example_code)


def add_confusion_matrix_to_main():
    """
    Código para añadir al final de tu main.py
    """
    
    code_to_add = '''
# Añadir al final de train_optimized_medical_classifier()

print("\\nGenerando matrices de confusión...")
predictions = trainer.predict(val_dataset)
pred_probs = torch.sigmoid(torch.tensor(predictions.predictions))
pred_labels = (pred_probs > 0.5).int().numpy()
true_labels = predictions.label_ids

# Crear visualización
categories = ['Neurological', 'Cardiovascular', 'Hepatorenal', 'Oncological']
fig, axes = plt.subplots(2, 2, figsize=(15, 12))
fig.suptitle('Confusion Matrices - Medical Categories', fontsize=16, fontweight='bold')
axes = axes.flatten()

for i, category in enumerate(categories):
    cm = confusion_matrix(true_labels[:, i], pred_labels[:, i])
    
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=['Negative', 'Positive'], 
                yticklabels=['Negative', 'Positive'],
                ax=axes[i])
    
    axes[i].set_title(f'{category}', fontweight='bold')
    axes[i].set_xlabel('Predicted')
    axes[i].set_ylabel('True')
    
    # Métricas adicionales
    tn, fp, fn, tp = cm.ravel()
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
    
    metrics_text = f'P: {precision:.3f}\\nR: {recall:.3f}\\nF1: {f1:.3f}'
    axes[i].text(0.02, 0.98, metrics_text, transform=axes[i].transAxes,
                verticalalignment='top', fontsize=10,
                bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))

plt.tight_layout()
plt.savefig('./confusion_matrices.png', dpi=300, bbox_inches='tight')
plt.show()

return trainer, final_metrics, (pred_labels, true_labels)
'''
    
    return code_to_add


if __name__ == "__main__":
    print("📊 GENERADOR DE MATRICES DE CONFUSIÓN PARA MULTI-LABEL")
    print("="*60)
    
    print("\\n🎯 Opción 1: Modificar tu main.py")
    print("Añade este código al final de train_optimized_medical_classifier():")
    print(add_confusion_matrix_to_main())
    
    print("\\n📋 Opción 2: Script completo")
    print("Ejecuta: python confusion_matrix_analysis.py")
    
    print("\\n💡 Recuerda importar:")
    print("import matplotlib.pyplot as plt")
    print("import seaborn as sns")
    print("from sklearn.metrics import confusion_matrix")