import csv

# Function to process and combine "Jr." and the first name correctly
def process_row(row):
    # Check if the third column contains "Jr." and the fourth column contains a first name
    if "Jr." in row[2] and len(row) > 3:
        first_name = row[3].strip()
        last_name = row[2].strip()

        # If the name is of the format "Jr.,FirstName" (comma is part of the name)
        if "," in first_name:
            # Combine "Jr." and first name into "Jr.,FirstName"
            row[2] = f"{last_name},{first_name}"
            row.pop(3)  # Remove the original first name column
        else:
            # If the first name is just a regular name, treat it as part of the full name
            row[2] = f"{last_name},{first_name}"  # Combine "Jr." and the first name
            row.pop(3)  # Remove the original first name column
    return row

# Read from the input CSV file and process
input_file = 'Texas_Last_Statement.csv'  # Replace with your actual input file path
output_file = 'output.csv'  # Replace with your desired output file path

# Open the input CSV file
with open(input_file, newline='', encoding='utf-8') as infile:
    reader = csv.reader(infile)
    # Open the output CSV file
    with open(output_file, mode='w', newline='', encoding='utf-8') as outfile:
        writer = csv.writer(outfile)
        
        # Process each row
        for row in reader:
            # Process the row to combine "Jr." and first name
            processed_row = process_row(row)
            # Write the processed row to the output file
            writer.writerow(processed_row)

print(f"CSV processing complete. The output is saved in {output_file}.")
