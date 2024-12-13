function closeHelp() {
    const helpDialog = document.getElementById('help');
    if (helpDialog) {
        helpDialog.close();
    }
}

document.getElementById('help-trigger').addEventListener('click', () => {
    document.getElementById('help').showModal();
});

document.getElementById('help').addEventListener('close', (event) => {
    // Optional: Handle dialog close event
});

document.getElementById('help-trigger').addEventListener('click', () => {
    document.getElementById('help').showModal();
});

document.getElementById('help').addEventListener('close', (event) => {
    // Optional: Handle dialog close event
});

const searchInput = document.getElementById('search');
let currentOffset = 0;
const pageSize = 10;
let hasMoreResults = true; // Variable to track if there are more results

// Function to fetch and display results
async function fetchResults(filter, append = false) {
    try {
        const response = await fetch(`/api/queries?filter=${encodeURIComponent(filter)}&from=${currentOffset}&size=${pageSize}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const resultsContainer = document.getElementById('results');

        if (!append) {
            resultsContainer.innerHTML = ''; // Clear previous results if not appending
        }

        if (data.length === 0 && !append) {
            resultsContainer.innerHTML = '<p>No results found.</p>';
            // Disable "Show More" if no results are found
            document.getElementById('show-more').disabled = true;
            document.getElementById('show-more').innerText = 'No more results';
            hasMoreResults = false;
            return;
        } else if (data.length === 0) {
            // Disable "Show More" if no more results
            document.getElementById('show-more').disabled = true;
            document.getElementById('show-more').innerText = 'No more results';
            hasMoreResults = false;
            return;
        }

        // Populate the results container with fetched data
        // Populate the results container with fetched data
        data.forEach(person => {
            // Create the card element
            const card = document.createElement('div');
            card.classList.add('card');
        
            // Add MugShot and Basic Info
            const cardHeader = document.createElement('div');
            cardHeader.classList.add('card-header');
        
            const mugShotDiv = document.createElement('div');
            mugShotDiv.classList.add('mugshot');
            const mugShotImg = document.createElement('img');
            mugShotImg.src = `https://www.tdcj.texas.gov/death_row/dr_info/${person._source.LastName}${person._source.FirstName}2.jpg`;
            mugShotImg.onerror = () => {
                mugShotImg.src = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
            };
            mugShotImg.alt = 'Mug_Shot';
            mugShotImg.classList.add('mugshot-img');
            mugShotDiv.appendChild(mugShotImg);
        
            const cardDetails = document.createElement('div');
            cardDetails.classList.add('card-details');
            const name = document.createElement('h3');
            name.textContent = `${person._source.FirstName} ${person._source.LastName}`;
            const ageRace = document.createElement('p');
            ageRace.textContent = `Age: ${person._source.Age} | Race: ${person._source.Race}`;
            const county = document.createElement('p');
            county.textContent = `County of Conviction: ${person._source.CountyOfConviction}`;
            const tdcjNumber = document.createElement('p');
            tdcjNumber.textContent = `TDCJ Number: ${person._source.TDCJNumber}`;
        
            cardDetails.appendChild(name);
            cardDetails.appendChild(ageRace);
            cardDetails.appendChild(county);
            cardDetails.appendChild(tdcjNumber);
        
            cardHeader.appendChild(mugShotDiv);
            cardHeader.appendChild(cardDetails);
        
            const buttonDiv = document.createElement('div');
            buttonDiv.classList.add('button-div');
            
            // Delete Button
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.classList.add('delete-button');
        
            // Add the delete functionality when the button is clicked
            deleteButton.onclick = () => deleteRecord(person._source.TDCJNumber, card);
        
            // Edit Button
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.classList.add('edit-button');
            editButton.onclick = () => openEditField(person._source.TDCJNumber, card);
        
            card.appendChild(cardHeader);
            
            // Add Additional Details
            const additionalDetails = document.createElement('div');
            additionalDetails.classList.add('additional-details');
            const additionalList = document.createElement('ul');
            const details = [
                { label: "Execution", value: person._source.Execution },
                { label: "Age When Received", value: person._source.AgeWhenReceived },
                { label: "Education Level", value: person._source.EducationLevel },
                { label: "Native County", value: person._source.NativeCounty },
                { label: "Previous Crime", value: person._source.PreviousCrime },
                { label: "Codefendants", value: person._source.Codefendants },
                { label: "Number of Victims", value: person._source.NumberVictim },
                { label: "White Victim", value: person._source.WhiteVictim },
                { label: "Hispanic Victim", value: person._source.HispanicVictim },
                { label: "Black Victim", value: person._source.BlackVictim },
                { label: "Victim of Other Races", value: person._source.VictimOtherRaces },
                { label: "Female Victim", value: person._source.FemaleVictim },
                { label: "Male Victim", value: person._source.MaleVictim },
            ];
        
            details.forEach(detail => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `<strong>${detail.label}:</strong> ${detail.value}`;
                additionalList.appendChild(listItem);
            });
        
            additionalDetails.appendChild(additionalList);
        
            // Add Last Statement
            const lastStatement = document.createElement('div');
            lastStatement.classList.add('last-statement');
            const statementHeading = document.createElement('h4');
            statementHeading.textContent = 'Last Statement';
            const statementPara = document.createElement('p');
            statementPara.textContent = person._source.LastStatement;
        
            lastStatement.appendChild(statementHeading);
            lastStatement.appendChild(statementPara);
        
            // Append everything to the card
            card.appendChild(cardHeader);
            card.appendChild(additionalDetails);
            card.appendChild(lastStatement);

            // Append the card to the results container
            resultsContainer.appendChild(card);            
            // Add the buttons to the button button-div
            card.appendChild(buttonDiv);
            buttonDiv.appendChild(deleteButton);
            buttonDiv.appendChild(editButton);
        
            // Function to open the edit field
            function openEditField(tdcjNumber, card) {
                // Check if the input field already exists
                if (card.querySelector('.edit-field')) return;
        
                // Create input field, save button, and delete button
                const editField = document.createElement('div');
                editField.classList.add('edit-field');
        
                const input = document.createElement('input');
                input.type = 'text';
                input.placeholder = 'Enter updates, e.g., Age = 100, Race = "White"';
        
                const saveButton = document.createElement('button');
                saveButton.textContent = 'Save';
                saveButton.classList.add('save-button');
                saveButton.onclick = () => saveEdit(tdcjNumber, input.value, card);
        
                const CancelButton = document.createElement('button');
                CancelButton.textContent = 'Cancel';
                CancelButton.classList.add('cancel-button');
                CancelButton.onclick = () => card.removeChild(editField);
        
                editField.appendChild(input);
                editField.appendChild(saveButton);
                editField.appendChild(CancelButton);
        
                card.appendChild(editField);
            }
        
            
            async function deleteRecord(tdcjNumber, card) {
                const fullCommand = `TDCJ = ${tdcjNumber}`;

                try {
                    // Sending the DELETE request to the server with the command
                    const response = await fetch('/api/delete', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ command: fullCommand })
                    });

                    // Check if the response is successful
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    // Show success message
                    alert('Record deleted successfully!');

                    // Debugging: Check if the card element is valid
                    console.log('Card element:', card);
                    card.remove();
                } catch (error) {
                    // Handle any errors during the deletion process
                    console.error('Error deleting record:', error);
                    alert('Failed to delete the record. Please try again.');
                }
            }
        
            // Save Edit Function
            async function saveEdit(tdcjNumber, command, card) {
                if (!command.trim()) {
                    alert('Please enter a valid command.');
                    return;
                }
        
                const fullCommand = `TDCJ = ${tdcjNumber} (${command});`;
        
                try {
                    const response = await fetch('/api/edit', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ command: fullCommand })
                    });
        
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
        
                    alert('Record updated successfully!');
                    card.querySelector('.edit-field').remove(); // Remove the input field after saving
                    fetchResults(searchInput.value); // Refresh the results
                } catch (error) {
                    console.error('Error saving edit:', error);
                    alert('Failed to save changes. Please try again.');
                }
            }
        });
    }
    catch (error) {
        console.error('Error fetching data:', error);
    }
}


// Add an event listener for the 'keypress' event on the search input
searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        currentOffset = 0; // Reset pagination
        hasMoreResults = true; // Reset the "no more results" flag
        fetchResults(searchInput.value, false);
    }
});

// Add "Show More" functionality
document.getElementById('show-more').addEventListener('click', () => {
    if (hasMoreResults) {
        currentOffset += pageSize; // Increment the offset
        fetchResults(searchInput.value, true); // Append results
    }
});
