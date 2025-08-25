import pandas as pd
import numpy as np
import random


def create_medical_text_variation(original_text):
    """
    Data augmentation específica para textos médicos multi-label
    Basada en el análisis de 81 ejemplos reales con 3-4 categorías
    """

    medical_synonyms = {
        'toxicity': ['adverse effects', 'side effects', 'toxic effects', 'harmful effects'],
        'nephrotoxicity': ['renal toxicity', 'kidney damage', 'renal adverse effects'],
        'hepatotoxicity': ['liver toxicity', 'hepatic damage', 'liver adverse effects'],
        'cardiotoxicity': ['cardiac toxicity', 'heart damage', 'cardiovascular toxicity'],

        'patient': ['subject', 'individual', 'case', 'participant'],
        'patients': ['subjects', 'individuals', 'cases', 'participants'],

        'treatment': ['therapy', 'intervention', 'management', 'therapeutic approach'],
        'therapy': ['treatment', 'intervention', 'therapeutic regimen'],
        'drug': ['medication', 'pharmaceutical agent', 'therapeutic agent'],
        'chemotherapy': ['anticancer treatment', 'cytotoxic therapy', 'oncological treatment'],

        'cardiac': ['cardiovascular', 'heart-related', 'myocardial'],
        'renal': ['kidney-related', 'nephrological'],
        'hepatic': ['liver-related', 'hepatological'],
        'neurological': ['neurologic', 'brain-related', 'cerebral'],

        'failure': ['dysfunction', 'impairment', 'insufficiency'],
        'dysfunction': ['impairment', 'abnormal function', 'malfunction'],
        'syndrome': ['condition', 'disorder', 'clinical syndrome'],
        'disease': ['disorder', 'condition', 'pathology'],

        'severe': ['serious', 'significant', 'marked', 'pronounced'],
        'acute': ['sudden onset', 'rapid', 'abrupt'],
        'chronic': ['long-term', 'persistent', 'prolonged']
    }

    medical_transitions = [
        'Clinical presentation revealed ',
        'Laboratory findings showed ',
        'The patient developed ',
        'Treatment resulted in ',
        'Complications included ',
        'Adverse effects comprised ',
        'Multiple organ involvement included ',
        'Systemic toxicity manifested as ',
        'Multi-organ dysfunction presented with '
    ]

    co_occurrence_patterns = {
        'cardio_renal': ['cardiac and renal complications', 'cardiovascular-renal syndrome', 'cardio-renal toxicity'],
        'neuro_cardio': ['neurological and cardiac effects', 'cerebro-cardiovascular complications'],
        'cancer_toxicity': ['chemotherapy-induced toxicity', 'anticancer drug adverse effects', 'oncological treatment complications'],
        'multi_organ': ['multi-organ toxicity', 'systemic adverse effects', 'multiple organ dysfunction']
    }

    words = original_text.split()
    transformed_words = []

    if random.random() < 0.2:
        transition = random.choice(medical_transitions)
        if not any(t.lower().strip() in original_text.lower()[:100] for t in medical_transitions):
            words = [transition.strip()] + words

    for word in words:
        clean_word = word.lower().strip('.,!?():;[]"')

        if clean_word in medical_synonyms and random.random() < 0.25:
            synonym = random.choice(medical_synonyms[clean_word])
            if word[0].isupper():
                synonym = synonym.capitalize()
            transformed_words.append(word.replace(clean_word, synonym))
        else:
            transformed_words.append(word)

    final_text = ' '.join(transformed_words)

    if random.random() < 0.15:
        organ_mentions = 0
        if any(term in final_text.lower() for term in ['cardiac', 'heart', 'cardiovascular']):
            organ_mentions += 1
        if any(term in final_text.lower() for term in ['renal', 'kidney', 'nephro']):
            organ_mentions += 1
        if any(term in final_text.lower() for term in ['hepatic', 'liver']):
            organ_mentions += 1
        if any(term in final_text.lower() for term in ['neuro', 'brain', 'cerebral']):
            organ_mentions += 1

        if organ_mentions >= 2:
            multi_organ_phrase = random.choice(co_occurrence_patterns['multi_organ'])
            sentences = final_text.split('. ')
            if len(sentences) > 1:
                insert_pos = len(sentences) // 2
                sentences.insert(insert_pos, f"This case demonstrates {multi_organ_phrase}")
                final_text = '. '.join(sentences)

    return final_text


def augment_multilabel_with_real_patterns(df, target_samples=40):
    """
    Data augmentation específica para tus patrones multi-label reales
    """
    print("Aplicando data augmentation basada en patrones reales...")

    df['num_labels'] = df['labels'].apply(lambda x: sum(x))
    df['label_combo'] = df['labels'].apply(lambda x: '|'.join([str(i) for i, v in enumerate(x) if v == 1]))

    multilabel_df = df[df['num_labels'] > 1].copy()
    combo_counts = multilabel_df['label_combo'].value_counts()

    print(f"Estado actual:")
    print(f"   - Muestras multi-label: {len(multilabel_df)}")
    print(f"   - Combinaciones únicas: {len(combo_counts)}")

    augmented_samples = []
    categories = ['neurological', 'cardiovascular', 'hepatorenal', 'oncological']

    for combo, current_count in combo_counts.items():
        if current_count < target_samples:
            needed = target_samples - current_count
            combo_data = multilabel_df[multilabel_df['label_combo'] == combo]

            combo_indices = [int(x) for x in combo.split('|')]
            combo_names = [categories[i] for i in combo_indices]

            print(f"   {' + '.join(combo_names)}: {current_count} -> {target_samples} (+{needed})")

            for _ in range(needed):
                base_sample = combo_data.sample(1).iloc[0]
                augmented_text = create_medical_text_variation(base_sample['text'])

                if random.random() < 0.1 and len(combo_data) > 1:
                    other_sample = combo_data.sample(1).iloc[0]
                    mid_point = len(augmented_text) // 2
                    other_mid = len(other_sample['text']) // 2
                    augmented_text = augmented_text[:mid_point] + " Furthermore, " + other_sample['text'][other_mid:]

                augmented_samples.append({
                    'text': augmented_text,
                    'labels': base_sample['labels']
                })

    if augmented_samples:
        print(f"Generadas {len(augmented_samples)} muestras sintéticas")
        augmented_df = pd.DataFrame(augmented_samples)
        final_df = pd.concat([df[['text', 'labels']], augmented_df], ignore_index=True)

        final_df['num_labels'] = final_df['labels'].apply(lambda x: sum(x))
        final_multilabel = final_df[final_df['num_labels'] > 1]
        print(f"Resultado: {len(final_multilabel)} muestras multi-label ({len(final_multilabel)/len(final_df)*100:.1f}%)")

        return final_df
    else:
        print("No se generaron muestras adicionales")
        return df[['text', 'labels']]


def create_targeted_synthetic_samples(df, focus_combinations):
    """
    Crear muestras sintéticas específicas para las combinaciones más difíciles
    """
    templates = {
        'cardio_renal_onco': [
            "{drug} treatment in {cancer_type} patients resulted in {cardiac_effect} and {renal_effect}. {outcome}",
            "Case report of {cancer_type} patient developing {cardiac_effect} and {renal_effect} following {drug} therapy. {complications}",
            "{drug}-induced {cardiac_effect} and {renal_effect} in oncological patients with {cancer_type}. {management}"
        ],
        'neuro_cardio_renal': [
            "Patient with {neuro_condition} developed {cardiac_effect} and {renal_effect} during treatment. {outcome}",
            "{drug} therapy caused {neuro_effect}, {cardiac_effect}, and {renal_effect} in this clinical case. {management}",
            "Multi-organ toxicity including {neuro_effect}, {cardiac_effect}, and {renal_effect} following {intervention}. {outcome}"
        ],
        'all_four': [
            "Complex case of {cancer_type} patient with {neuro_condition} developing {cardiac_effect}, {renal_effect}, and {hepatic_effect}. {comprehensive_management}",
            "{drug} treatment resulted in multi-system toxicity: {neuro_effect}, {cardiac_effect}, {hepatic_effect}, and {renal_effect}. {outcome}",
            "Rare presentation of {syndrome} with neurological, cardiovascular, hepatic, and renal involvement. {clinical_course}"
        ]
    }

    variables = {
        'drug': ['doxorubicin', 'cisplatin', 'tacrolimus', 'amiodarone', 'lithium', 'phenytoin'],
        'cancer_type': ['leukemia', 'lymphoma', 'carcinoma', 'sarcoma', 'breast cancer', 'lung cancer'],
        'cardiac_effect': ['cardiotoxicity', 'arrhythmias', 'heart failure', 'myocardial dysfunction'],
        'renal_effect': ['nephrotoxicity', 'acute renal failure', 'renal dysfunction', 'kidney damage'],
        'hepatic_effect': ['hepatotoxicity', 'liver dysfunction', 'hepatic failure', 'liver damage'],
        'neuro_effect': ['neurotoxicity', 'encephalopathy', 'seizures', 'cognitive impairment'],
        'neuro_condition': ['stroke', 'epilepsy', 'dementia', 'Parkinson disease'],
        'outcome': ['Patient recovered with supportive care.', 'Long-term monitoring required.', 'Partial recovery achieved.'],
        'complications': ['Multiple complications required intensive management.', 'Severe adverse effects were observed.'],
        'management': ['Treatment was discontinued and supportive care initiated.', 'Dose reduction and monitoring implemented.'],
        'comprehensive_management': ['Multidisciplinary approach required for optimal outcomes.', 'Complex case requiring specialized care.'],
        'intervention': ['chemotherapy', 'immunosuppressive therapy', 'antiarrhythmic treatment'],
        'syndrome': ['multi-organ failure syndrome', 'drug-induced multi-system toxicity', 'complex clinical syndrome'],
        'clinical_course': ['Progressive deterioration observed.', 'Gradual improvement with treatment modifications.']
    }

    synthetic_samples = []

    for combo_name, template_list in templates.items():
        for _ in range(5):
            template = random.choice(template_list)

            filled_template = template
            for var_name, var_options in variables.items():
                if f'{{{var_name}}}' in filled_template:
                    filled_template = filled_template.replace(f'{{{var_name}}}', random.choice(var_options))

            if combo_name == 'cardio_renal_onco':
                labels = [0, 1, 1, 1]
            elif combo_name == 'neuro_cardio_renal':
                labels = [1, 1, 1, 0]
            elif combo_name == 'all_four':
                labels = [1, 1, 1, 1]

            synthetic_samples.append({
                'text': filled_template,
                'labels': labels
            })

    return synthetic_samples