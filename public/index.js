let target = document.documentElement;
let body = document.body;
let fileInput = document.getElementById("selectedFile");

if (fileInput) {
    fileInput.onchange = function() {
        upload();
    };
}

// Prevent default behavior when dragging over the target
target.addEventListener('dragover', (e) => {
    if ($(".clickListenerFile")[0]) {
        e.preventDefault();
        body.classList.add('dragging');
    }
});

// Remove dragging class when leaving the drop zone
target.addEventListener('dragleave', () => {
    body.classList.remove('dragging');
});

// Handle the drop event
target.addEventListener('drop', (e) => {
    if ($(".clickListenerFile")[0]) {
        e.preventDefault();
        body.classList.remove('dragging');
        fileInput.files = e.dataTransfer.files;
        upload();
    }
});

// Handle pasting files from clipboard
window.addEventListener('paste', e => {
    if (e.clipboardData.files.length > 0) {
        fileInput.files = e.clipboardData.files;
        upload();
    }
});

// Click handler for triggering file selection
function handleClick() {
    if ($(".clickListenerFile")[0]) {
        $(".clickListenerFile").click();
    }
}

async function upload() {
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a file to upload.");
        return;
    }

    const maxSizeInBytes = 250 * 1024 * 1024; // 5 MB
    if (file.size > maxSizeInBytes) {
        alert("File size exceeds the 250 MB limit.");
        resetUI();
        return;
    }

    // Hide initial UI elements and show uploading UI
    $(".headline, .description, .upload-button").hide();
    $(".headline-uploading, .description-uploading").show();

    // Generate a random ID to use as the new filename in GCS
    const fileId = generateRandomId();
    const newFileName = `${fileId}.mov`; // Use generated ID with .mov extension

    try {
        // Get a signed URL for the new file name
        const signedUrl = await GetSignedUrl(newFileName);

        // Initialize a new XMLHttpRequest for tracking progress
        const xhr = new XMLHttpRequest();

        // Set up the progress event listener
        xhr.upload.addEventListener("progress", function(evt) {
            if (evt.lengthComputable) {
                const percentComplete = Math.round((evt.loaded / evt.total) * 100);
                $(".description-uploading").html(`${percentComplete}% complete.`);
                
                if (percentComplete === 100) {
                    $(".description-uploading").html("Finalizing...");
                }
            }
        }, false);

        // Set up success and error callbacks
        xhr.onload = function() {
            if (xhr.status === 200) {
                // Redirect to the URL with only the generated ID
                window.location.href = `https://www.veezo.pro/v_?id=${fileId}`;
            } else {
                alert("An error occurred during the upload. Please try again.");
                resetUI();
            }
        };

        xhr.onerror = function() {
            console.error("Upload error:", xhr.statusText);
            alert("An error occurred during the upload. Please try again.");
            resetUI();
        };

        // Open a PUT request with the signed URL
        xhr.open("PUT", signedUrl, true);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

        // Send the file data
        xhr.send(file);
    } catch (error) {
        console.error("Upload error:", error);
        alert("An error occurred during the upload. Please try again.");
        resetUI();
    }
}

// Helper function to generate a random video ID
function generateRandomId() {
    return Math.random().toString(36).substr(2, 6); // Generates a 6-character ID
}

// Helper function to reset the UI on error
function resetUI() {
    $(".headline").show();
    $(".description").show();
    $(".upload-button").show();
    $(".headline-uploading").hide();
    $(".description-uploading").hide();
}