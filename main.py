from src.main import train_optimized_medical_classifier
from src.prediction import predict_medical_categories


if __name__ == "__main__":
    print("Iniciando pipeline completo de optimización...")
    
    # Entrenar modelo
    csv_file = "challenge_data-18-ago.csv"
    trainer, metrics = train_optimized_medical_classifier(csv_file)
    
    # Ejemplo de predicción
    sample_text = """P53 inhibition exacerbates late-stage anthracycline cardiotoxicity. 
    Doxorubicin (DOX) is an effective anti-cancer therapeutic, but is associated with 
    both acute and late-stage cardiotoxicity. Children are particularly sensitive to 
    DOX-induced heart failure."""
    
    predictions = predict_medical_categories(sample_text)
    
    print(f"\nEjemplo de predicción:")
    print(f"Texto: {sample_text[:60]}...")
    print(f"\nResultados:")
    for pred in predictions:
        if pred['predicted']:
            print(f"  + {pred['category']:15}: {pred['probability']:.3f}")
        else:
            print(f"  - {pred['category']:15}: {pred['probability']:.3f}")