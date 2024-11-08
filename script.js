$(document).ready(function() {
    const apiUrl = 'https://usmanlive.com/wp-json/api/stories/';
    const editModal = new bootstrap.Modal(document.getElementById('editModal'));

    // Validation functions
    function validateTitle(title) {
        if (!title) return 'Title is required';
        if (title.length < 3) return 'Title must be at least 3 characters long';
        if (title.length > 50) return 'Title must be less than 50 characters';
        return null;
    }

    function validateContent(content) {
        if (!content) return 'Content is required';
        if (content.length < 10) return 'Content must be at least 10 characters long';
        if (content.length > 1000) return 'Content must be less than 1000 characters';
        return null;
    }

    function showError(inputElement, message) {
        const formGroup = inputElement.closest('.form-group');
        formGroup.addClass('has-error');
        
        // Remove any existing error message
        formGroup.find('.error-message').remove();
        
        // Add new error message
        const errorDiv = $('<div>')
            .addClass('error-message')
            .text(message);
        formGroup.append(errorDiv);
        
        // Add red border to input
        inputElement.addClass('is-invalid');
    }

    function clearErrors(formElement) {
        formElement.find('.has-error').removeClass('has-error');
        formElement.find('.error-message').remove();
        formElement.find('.is-invalid').removeClass('is-invalid');
    }

    // Fetch and display stories
    function loadStories() {
        $.ajax({
            url: apiUrl,
            method: 'GET',
            success: function(response) {
                const storiesList = $('#storiesList');
                storiesList.empty();

                response.forEach((story, index) => {
                    if (story.title && story.content) {
                        const storyCard = createStoryCard(story, index);
                        storiesList.append(storyCard);
                    }
                });

                // Add event listeners after loading stories
                attachEventListeners();
            },
            error: function(xhr, status, error) {
                showToast('Error', 'Error loading stories: ' + error, 'error');
            }
        });
    }

    // Attach event listeners to dynamically created elements
    function attachEventListeners() {
        // Edit button click handler
        $('.btn-edit').off('click').on('click', function() {
            const storyCard = $(this).closest('.story-card');
            const storyId = $(this).data('story-id');
            const title = storyCard.find('.story-title').text();
            const content = storyCard.find('.story-content').text();
            
            $('#editId').val(storyId);
            $('#editTitle').val(title);
            $('#editContent').val(content);
            
            editModal.show();
        });

        // Delete button click handler
        $('.btn-delete').off('click').on('click', function() {
            const storyCard = $(this).closest('.story-card');
            const storyId = $(this).data('story-id');
            const title = storyCard.find('.story-title').text();
            
            if (confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
                deleteStory(storyId, $(this));
            }
        });
    }

    // Delete story function
    function deleteStory(storyId, deleteBtn) {
        deleteBtn.html('<i class="fas fa-spinner fa-spin"></i>');
        deleteBtn.prop('disabled', true);
        
        $.ajax({
            url: apiUrl + storyId,
            method: 'DELETE',
            success: function(response) {
                loadStories();
                showToast('Success', 'Story deleted successfully!', 'success');
            },
            error: function(xhr, status, error) {
                showToast('Error', 'Failed to delete story: ' + error, 'error');
                deleteBtn.html('<i class="fas fa-trash-alt"></i> Delete');
                deleteBtn.prop('disabled', false);
            }
        });
    }

    // Save edited story
    $('#saveEdit').on('click', function() {
        const storyId = $('#editId').val();
        const title = $('#editTitle').val().trim();
        const content = $('#editContent').val().trim();

        // Validate inputs
        const titleError = validateTitle(title);
        const contentError = validateContent(content);
        
        clearErrors($('#editForm'));
        let hasError = false;
        
        if (titleError) {
            showError($('#editTitle'), titleError);
            hasError = true;
        }
        
        if (contentError) {
            showError($('#editContent'), contentError);
            hasError = true;
        }
        
        if (hasError) return;

        const saveBtn = $(this);
        const originalText = saveBtn.html();
        saveBtn.html('<i class="fas fa-spinner fa-spin"></i> Saving...');
        saveBtn.prop('disabled', true);

        $.ajax({
            url: apiUrl + storyId,
            method: 'PUT',
            data: { title, content },
            success: function(response) {
                editModal.hide();
                loadStories();
                showToast('Success', 'Story updated successfully!', 'success');
            },
            error: function(xhr, status, error) {
                showToast('Error', 'Failed to update story: ' + error, 'error');
            },
            complete: function() {
                saveBtn.html(originalText);
                saveBtn.prop('disabled', false);
            }
        });
    });

    // Toast notification function
    function showToast(title, message, type) {
        const toast = $(`
            <div class="toast-notification ${type}">
                <div class="toast-header">
                    <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                    <strong>${title}</strong>
                </div>
                <div class="toast-body">${message}</div>
            </div>
        `);
        
        $('body').append(toast);
        setTimeout(() => toast.addClass('show'), 100);
        setTimeout(() => {
            toast.removeClass('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Update the createStoryCard function
    function createStoryCard(story, index) {
        return `
            <div class="story-card">
                <div class="story-number">#${index + 1}</div>
                <div class="story-content-wrapper">
                    <div class="story-info">
                        <h3 class="story-title">${story.title}</h3>
                        <p class="story-content">${story.content}</p>
                        <div class="story-meta">
                            <span class="story-date">
                                <i class="far fa-calendar-alt"></i>
                                ${new Date().toLocaleDateString()}
                            </span>
                            <span class="story-date">
                                <i class="far fa-clock"></i>
                                ${new Date().toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                    <div class="story-actions">
                        <button class="btn-edit" data-story-id="${story.id}">
                            <i class="fas fa-edit"></i>
                            Edit
                        </button>
                        <button class="btn-delete" data-story-id="${story.id}">
                            <i class="fas fa-trash-alt"></i>
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Create new story
    $('#storyForm').on('submit', function(e) {
        e.preventDefault();
        clearErrors($(this));
        
        const title = $('#title').val().trim();
        const content = $('#content').val().trim();
        
        // Validate inputs
        const titleError = validateTitle(title);
        const contentError = validateContent(content);
        
        let hasError = false;
        
        if (titleError) {
            showError($('#title'), titleError);
            hasError = true;
        }
        
        if (contentError) {
            showError($('#content'), contentError);
            hasError = true;
        }
        
        if (hasError) return;

        // Show loading state
        const submitBtn = $(this).find('button[type="submit"]');
        const originalText = submitBtn.html();
        submitBtn.html('<i class="fas fa-spinner fa-spin"></i> Publishing...');
        submitBtn.prop('disabled', true);

        const storyData = {
            title: title,
            content: content
        };

        $.ajax({
            url: apiUrl,
            method: 'POST',
            data: JSON.stringify(storyData),
            contentType: 'application/json',
            success: function(response) {
                $('#storyForm')[0].reset();
                loadStories();
                showToast('Success', 'Story published successfully!', 'success');
            },
            error: function(xhr, status, error) {
                showToast('Error', 'Failed to publish story: ' + error, 'error');
            },
            complete: function() {
                submitBtn.html(originalText);
                submitBtn.prop('disabled', false);
            }
        });
    });

    // Initial load
    loadStories();
});