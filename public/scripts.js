const apiUrl = 'https://blog.pavelrampas.cz';
const apiAuth = 'd58e3582afa99040e27b92b13c8f2280';

// Load comments
const commentsDiv = document.getElementById('comments');
if (commentsDiv) {
    loadComments();
}

// Load comments count
const articleMetaElements = document.querySelectorAll('.article-meta[data-article-id]');
if (articleMetaElements.length > 0) {
    loadCommentsCount(articleMetaElements);
}

// Load comments count
function loadCommentsCount(articlesMeta) {
    const articleIds = [];
    articlesMeta.forEach(article => {
        articleIds.push(article.dataset.articleId);
    });

    fetch(apiUrl + '/api/v1/comments-count/?' + articleIds.map(id => `ids[]=${id}`).join('&'), {
        method: 'GET',
        headers: {'Authorization': apiAuth},
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        // Check if the response contains an error
        if (data.errors) {
            alert(data.errors[0].detail);
            return;
        }

        if (data.data.length > 0) {
            articlesMeta.forEach(articleMeta => {
                for (const commentCount of data.data) {
                    if (parseInt(commentCount.id) === parseInt(articleMeta.dataset.articleId)) {
                        // Get the article URL
                        const url = articleMeta.closest('article').getElementsByTagName('h2')[0].getElementsByTagName('a')[0].href;

                        // Add separator
                        const separator = document.createElement('span');
                        separator.className = 'article-meta-separator';
                        separator.textContent = ' | ';
                        articleMeta.appendChild(separator);

                        // Add comment count with link
                        const countElement = document.createElement('span');
                        countElement.className = 'article-meta-comments-count';
                        countElement.innerHTML = '<a href="' + url + '#comments">' + formatCommentCount(commentCount.attributes.count) + '</a>';
                        articleMeta.appendChild(countElement);
                        break;
                    }
                }
            });
        }
    })
    .catch(error => console.error('Error loading comments count:', error));
}

// Load comments
function loadComments() {
    fetch(apiRequestUrl(), {
        method: 'GET',
        headers: {'Authorization': apiAuth},
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        // Unhide the comments section
        const commentsSection = document.getElementById('comments');
        if (commentsSection) {
            commentsSection.classList.remove('hide');
        }

        if (!commentsSection) {
            console.error("Comments section not found.");
            return;
        }

        commentsSection.innerHTML = '<h3>Komentáře</h3>'
            + '<div id="comment-list">'
            +     '<p>Zatím tu není žádný komentář.</p>'
            + '</div>'

            + '<form action="" method="post" id="comment-form">'
            +     '<h3>Nový komentář</h3>'
            +     '<div class="form-group">'
            +         '<label for="name">Jméno*</label>'
            +         '<br>'
            +         '<input type="text" id="name" name="name" required>'
            +     '</div>'
            +     '<div class="form-group">'
            +         '<label for="email">E-mail* (nebude zveřejněn)</label>'
            +         '<br>'
            +         '<input type="email" id="email" name="email" required>'
            +     '</div>'
            +     '<div class="form-group">'
            +         '<label for="comment">Komentář*</label>'
            +         '<br>'
            +         '<textarea id="comment" name="comment" rows="4" required></textarea>'
            +     '</div>'
            +     '<input type="hidden" name="post-id" id="post-id" value="1000">'
            +     '<input type="hidden" name="email-check" id="email-check" value="">'
            +     '<input type="hidden" name="time-check" id="time-check" value="' + new Date().getTime() + '">'
            +     '<div class="form-group">'
            +         '<button type="submit">Odeslat komentář</button>'
            +     '</div>'
            + '</form>';

        addCommentEventListener();

        // Check if the response contains an error
        if (data.errors) {
            alert(data.errors[0].detail);
            return;
        }

        if (data.data.length > 0) {
            const commentList = document.getElementById('comment-list');

            commentList.innerHTML = '';

            for (const comment of data.data) {
                const commentElement = createCommentElement(comment);
                commentList.appendChild(commentElement);
            }
        }
    })
    .catch(error => console.error('Error loading comments:', error));
}

// Add a new comment
function addComment() {
    const comment = document.getElementById('comment').value.trim();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const emailCheck = document.getElementById('email-check').value.trim();
    const timeCheck = document.getElementById('time-check').value.trim();

    // Validate email check
    if (emailCheck !== '') {
        alert("Antispamová kontrola selhala. Zkuste to prosím znovu.");
        return;
    }

    // Validate time check
    const currentTime = new Date().getTime();
    if (currentTime - parseInt(timeCheck) < 5000) { // less than 5 seconds
        alert("Antispamová kontrola selhala. Zkuste to prosím znovu.");
        return;
    }

    // validate email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        alert("Zadejte prosím platnou e-mailovou adresu.");
        return;
    }
    // validate comment
    if (comment.length < 5 || comment.length > 500) {
        alert("Komentář musí mít alespoň 5 znaků a maximálně 500 znaků.");
        return;
    }
    // validate name
    if (name.length < 3 || name.length > 50) {
        alert("Jméno musí mít alespoň 3 znaky a maximálně 50 znaků.");
        return;
    }

    fetch(apiRequestUrl(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': apiAuth
        },
        credentials: 'include',
        body: JSON.stringify({
            comment: comment,
            name: name,
            email: email,
            email_check: emailCheck,
            time_check: timeCheck
        })
    })
    .then(response => response.json())
    .then(data => {
        // Check if the response contains an error
        if (data.errors) {
            alert(data.errors[0].detail);
            return;
        }

        // Clear the form fields
        document.getElementById('comment').value = '';
        document.getElementById('name').value = '';
        document.getElementById('email').value = '';

        // Add the new comment to the list
        const commentList = document.getElementById('comment-list');
        const newCommentElement = createCommentElement(data.data[0]);
        commentList.appendChild(newCommentElement);
    })
    .catch(error => console.error('Error adding comment:', error));
}

// Form submit event listener
function addCommentEventListener() {
    document.getElementById('comment-form').addEventListener('submit', function(event) {
        event.preventDefault();

        // Disable form button to prevent multiple submissions
        const submitButton = this.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Odesílání...';

        addComment();

        // Re-enable the button
        submitButton.disabled = false;
        submitButton.textContent = 'Odeslat komentář';
    });
}

// Function to construct the API request URL
function apiRequestUrl() {
    const commentsDiv = document.getElementById('comments');
    return apiUrl + '/api/v1/comments/index.php?article=' + commentsDiv.dataset.articleId;
}

// Function to create a comment element
function createCommentElement(comment) {
    const commentElement = document.createElement('div');
    commentElement.className = 'comment';
    commentElement.id = 'comment-' + comment.id;
    commentElement.innerHTML = '<p class="comment-name">'
        + '<strong>' + comment.attributes.name + '</strong>'
        + '<a href="#comment-' + comment.id + '" class="comment-date">'
        + new Date(comment.attributes.created).toLocaleString(undefined, {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false, minute:'2-digit'})
        + '</a>'
        + '</p>'
        + '<p>' + comment.attributes.comment + '</p>';
    return commentElement;
}

// Function to format comment count text
function formatCommentCount(count) {
    if (count === 0) {
        return '0&nbsp;komentářů';
    } else if (count === 1) {
        return '1&nbsp;komentář';
    } else if (count === 2 || count === 3 || count === 4) {
        return count + '&nbsp;komentáře';
    } else {
        return count + '&nbsp;komentářů';
    }
}
