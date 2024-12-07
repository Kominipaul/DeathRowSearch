document.getElementById('help-trigger').addEventListener('click', () => {
    document.getElementById('help').showModal();
});

document.getElementById('help').addEventListener('close', (event) => {
    // Optional: Handle dialog close event
});

const searchInput = document.getElementById('search');
let currentOffset = 0;
const pageSize = 10;

// Function to fetch and display results
async function fetchResults(filter, append = false) {
    try {
        const response = await fetch(`/api/statements?filter=${encodeURIComponent(filter)}&from=${currentOffset}&size=${pageSize}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const resultsContainer = document.getElementById('results');

        // Clear previous results if not appending
        if (!append) {
            resultsContainer.innerHTML = ''; 
        }

        // Check if no data is available and handle the "No results found" case
        if (data.length === 0 && !append) {
            resultsContainer.innerHTML = '<p>No results found.</p>';
            return;
        } else if (data.length === 0) {
            document.getElementById('show-more').disabled = true;
            document.getElementById('show-more').innerText = 'No more results';
            return;
        }

        // Populate the results container with fetched data
        data.forEach(person => {
            const card = document.createElement('div');
            card.classList.add('card');

            // Add MugShot and Basic Info
            const cardHeader = document.createElement('div');
            cardHeader.classList.add('card-header');

            const mugShotDiv = document.createElement('div');
            mugShotDiv.classList.add('mugshot');
            const mugShotImg = document.createElement('img');
            mugShotImg.src = 'https://avatars.githubusercontent.com/u/40539574?v=4'; // Replace with dynamic data if available
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
        });
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Add an event listener for the 'keypress' event on the search input
searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        currentOffset = 0; // Reset pagination to 0 for the new query
        document.getElementById('show-more').disabled = false; // Re-enable "Show More" button
        document.getElementById('show-more').innerText = 'Show More'; // Reset the text
        fetchResults(searchInput.value, false); // Fetch new results without appending
    }
});

// Add "Show More" functionality
document.getElementById('show-more').addEventListener('click', () => {
    currentOffset += pageSize; // Increment the offset for pagination
    fetchResults(searchInput.value, true); // Append new results to the current results
});
