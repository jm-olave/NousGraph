# Health Project - Medical Text Classification

## 📋 Descripción del Proyecto

Este proyecto implementa un sistema de clasificación multi-etiqueta de textos médicos utilizando PubMedBERT, un modelo basado en BERT específicamente entrenado en literatura médica. El sistema es capaz de clasificar artículos médicos en cuatro categorías principales:

- **Neurological** (Neurológico)
- **Cardiovascular** (Cardiovascular)
- **Hepatorenal** (Hepatorrenal)
- **Oncological** (Oncológico)

## 🎯 Objetivos

- Clasificar automáticamente documentos médicos en múltiples categorías simultáneamente
- Manejar el desbalance de clases típico en datasets médicos
- Optimizar el rendimiento para casos multi-etiqueta raros
- Proporcionar predicciones con niveles de confianza

## 🏗️ Estructura del Proyecto

```
health_project/
├── README.md                           # Este archivo
├── requirements.txt                    # Dependencias del proyecto
├── main.py                            # Script principal de ejecución
├── challenge_data-18-ago.csv          # Dataset de entrenamiento
├── DataAnalysis.ipynb                 # Análisis exploratorio de datos
├── last_final.ipynb                  # Notebook final con entrenamiento completo
├── confusion_matrix_analysis.py       # Análisis de matriz de confusión
├── simple_confusion_matrix.py         # Matriz de confusión simplificada
├── src/                               # Código fuente principal
│   ├── __init__.py
│   ├── main.py                        # Función principal de entrenamiento
│   ├── model_utils.py                 # Utilidades del modelo
│   ├── data_processing.py             # Procesamiento de datos
│   ├── training.py                    # Clases de entrenamiento
│   ├── prediction.py                  # Funciones de predicción
│   ├── augmentation.py                # Técnicas de data augmentation
│   └── pubmedbert-medical-v6/         # Modelo entrenado
└── wandb/                             # Logs de experimentos
```

## 🔧 Instalación

### Requisitos
- Python 3.8+
- CUDA (para entrenamiento con GPU)

### Configuración del entorno
```bash
# Clonar el repositorio
git clone <repository-url>
cd health_project

# Instalar dependencias
pip install -r requirements.txt
```

### Dependencias principales
- `torch` - PyTorch para deep learning
- `transformers` - Biblioteca de Hugging Face para modelos pre-entrenados
- `scikit-learn` - Métricas y división de datos
- `pandas` - Manipulación de datos
- `numpy` - Operaciones numéricas
- `wandb` - Seguimiento de experimentos
- `seaborn`, `matplotlib` - Visualización

## 📊 Dataset

El dataset `challenge_data-18-ago.csv` contiene **3,565 artículos médicos** con:
- **title**: Título del artículo
- **abstract**: Resumen del artículo
- **group**: Categorías médicas (separadas por "|")

### Distribución de clases
```
neurological:                    1,058 (29.7%)
cardiovascular:                    645 (18.1%)
hepatorenal:                       533 (15.0%)
neurological|cardiovascular:       308 (8.6%)
oncological:                       237 (6.6%)
neurological|hepatorenal:          202 (5.7%)
cardiovascular|hepatorenal:        190 (5.3%)
neurological|oncological:          143 (4.0%)
...y más combinaciones
```

## 🚀 Uso

### Entrenamiento del modelo
```bash
python main.py
```

### Uso desde código Python
```python
from src.main import train_optimized_medical_classifier
from src.prediction import predict_medical_categories

# Entrenar modelo
trainer, metrics = train_optimized_medical_classifier("challenge_data-18-ago.csv")

# Hacer predicciones
text = "Patient developed cardiotoxicity after chemotherapy treatment..."
predictions = predict_medical_categories(text)

for pred in predictions:
    if pred['predicted']:
        print(f"{pred['category']}: {pred['probability']:.3f}")
```

## 🧠 Arquitectura del Modelo

### Modelo Base
- **PubMedBERT**: `microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext`
- **Tipo**: Clasificación multi-etiqueta
- **Salida**: 4 neuronas con activación sigmoidal

### Optimizaciones implementadas

1. **Manejo de desbalance de clases**:
   - Pesos de clase calculados automáticamente
   - BCE loss con ponderación por posición

2. **Data Augmentation**:
   - Aumentación específica para textos médicos
   - Generación de muestras sintéticas para combinaciones raras

3. **Configuración de entrenamiento**:
   - Learning rate: 2e-5
   - Batch size efectivo: 24 (6 × 4 gradient accumulation)
   - Épocas: 4
   - Regularización: Weight decay 0.1, Label smoothing 0.05

## 📈 Métricas de Evaluación

El modelo utiliza múltiples métricas para evaluación:

- **F1 Macro**: Promedio no ponderado de F1 por clase
- **F1 Micro**: F1 global considerando todas las predicciones
- **F1 Weighted**: F1 ponderado por frecuencia de clase
- **Subset Accuracy**: Exactitud de predicción completa
- **Hamming Loss**: Pérdida promedio por etiqueta

### Métricas por categoría individual
- Precisión, Recall y F1-Score para cada categoría médica

## 🔍 Análisis de Datos

### Notebooks disponibles

1. **DataAnalysis.ipynb**:
   - Análisis exploratorio completo
   - Visualizaciones de distribución
   - WordClouds por categoría
   - Análisis de longitud de texto

2. **last_final.ipynb**:
   - Pipeline completo de entrenamiento
   - Experimentación con hiperparámetros
   - Funciones de prueba y predicción

## ⚡ Características Avanzadas

### Data Augmentation Inteligente
- Sinónimos médicos específicos
- Patrones de co-ocurrencia
- Templates para combinaciones raras

### Manejo de Multi-etiquetas
- Estratificación preservando distribución multi-etiqueta
- Métricas especializadas para clasificación multi-etiqueta
- Análisis de patrones de co-ocurrencia

### Monitoreo y Logging
- Integración con Weights & Biases (wandb)
- Seguimiento detallado de métricas
- Visualización de progreso en tiempo real

## 🎛️ Configuración Avanzada

### Hiperparámetros principales
```python
TrainingArguments(
    num_train_epochs=4,
    per_device_train_batch_size=6,
    gradient_accumulation_steps=4,
    learning_rate=2e-5,
    weight_decay=0.1,
    warmup_ratio=0.1,
    lr_scheduler_type="cosine_with_restarts",
    label_smoothing_factor=0.05
)
```

### Threshold de predicción
- Por defecto: 0.5
- Ajustable según necesidades del dominio
- Optimizable mediante validación cruzada

## 📋 Resultados Esperados

El modelo está optimizado para:
- **Casos multi-etiqueta**: Identificación precisa de documentos con múltiples categorías
- **Categorías raras**: Manejo especial de combinaciones poco frecuentes
- **Interpretabilidad**: Probabilidades de confianza para cada categoría

## 🤝 Contribución

Para contribuir al proyecto:
1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo licencia [especificar licencia].

## 🔬 Casos de Uso

### Ejemplos de aplicación
- **Clasificación automática** de literatura médica
- **Indexación** de bases de datos médicas
- **Filtrado inteligente** por especialidad médica
- **Análisis de tendencias** en investigación médica

### Ejemplo de predicción
```python
texto = "Doxorubicin cardiotoxicity in cancer patients with renal dysfunction"
# Resultado esperado: cardiovascular + hepatorenal + oncological
```

## 📞 Contacto

Para preguntas o soporte, contactar a [información de contacto].

---

*Proyecto desarrollado para la clasificación automática de textos médicos usando técnicas de deep learning y NLP especializado.*