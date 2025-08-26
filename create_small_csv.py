import csv

def create_small_csv(input_file, output_file, num_rows=10):
    """
    Create a smaller CSV file with the specified number of rows from the input CSV,
    including only title and abstract columns.

    Args:
        input_file (str): Path to the input CSV file
        output_file (str): Path for the output CSV file
        num_rows (int): Number of rows to include in the smaller CSV (default: 10)
    """
    try:
        with open(input_file, 'r', encoding='utf-8') as infile, open(output_file, 'w', newline='', encoding='utf-8') as outfile:
            reader = csv.reader(infile, delimiter=';')
            writer = csv.writer(outfile, delimiter=';')

            # Write header
            writer.writerow(['title', 'abstract'])

            # Skip the original header and write first num_rows data rows
            next(reader)  # Skip header
            count = 0
            for row in reader:
                if count >= num_rows:
                    break
                # Write only title and abstract (first two columns)
                writer.writerow(row[:2])
                count += 1

        print(f"Successfully created {output_file} with {count} rows from {input_file}")

    except FileNotFoundError:
        print(f"Error: File {input_file} not found.")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    input_file = "challenge_data-18-ago.csv"
    output_file = "small_challenge_data_fixed.csv"
    create_small_csv(input_file, output_file)