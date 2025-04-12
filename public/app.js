// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    getDoc,
    updateDoc,
    deleteDoc, // Import deleteDoc
    doc,
    serverTimestamp,
    query,
    where,
    orderBy,
    increment,
    setDoc,
    onSnapshot // For real-time comment updates
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBQKlmAW2-DmSOkX_eNKiJFf_HvSBfefA8",
  authDomain: "civic-pulse-c4f40.firebaseapp.com",
  projectId: "civic-pulse-c4f40",
  storageBucket: "civic-pulse-c4f40.firebasestorage.app",
  messagingSenderId: "1087067890965",
  appId: "1:1087067890965:web:acf57344bf51b65eda751c",
  measurementId: "G-G9PJ9SB2PK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements (Ensure all IDs match the HTML)
const userSection = document.getElementById('user-section');
const authContainer = document.getElementById('auth-container');
const loginFormContainer = document.getElementById('login-form-container');
const signupFormContainer = document.getElementById('signup-form-container');
const contentContainer = document.getElementById('content-container');
const issuesContainer = document.getElementById('issues-container');
const newIssueBtn = document.getElementById('new-issue-btn');
const newIssueFormContainer = document.getElementById('new-issue-form-container');
const issueForm = document.getElementById('issue-form');
const cancelIssueBtn = document.getElementById('cancel-issue-btn');
const neighborhoodFilter = document.getElementById('neighborhood-filter');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const showSignupLink = document.getElementById('show-signup');
const showLoginLink = document.getElementById('show-login');

// Global state
let currentUser = null;
let currentNeighborhood = neighborhoodFilter.value;
let userDataCache = {}; // Simple cache for usernames
let issueListeners = []; // To detach listeners if needed

// --- Authentication ---

onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    userDataCache = {}; // Clear cache on auth change

    if (user) {
        console.log("User logged in:", user.uid);
        await fetchAndCacheUserData(user.uid);
        const username = userDataCache[user.uid]?.username || user.email.split('@')[0]; // Fallback to email prefix
        showLoggedInUI(username);
        contentContainer.style.display = 'block';
        authContainer.style.display = 'none';
        newIssueBtn.disabled = false;
        loadIssues(currentNeighborhood); // Reload issues to enable voting/commenting/editing
    } else {
        console.log("User logged out");
        showLoginUI();
        contentContainer.style.display = 'none';
        authContainer.style.display = 'block';
        loadIssues(currentNeighborhood); // Load issues publicly (actions disabled)
    }
});

function showLoginUI() {
    userSection.innerHTML = `
        <button id="login-nav-btn" class="btn btn-outline-light btn-sm">Login / Sign Up</button>
    `;
    document.getElementById('login-nav-btn')?.addEventListener('click', () => {
        authContainer.style.display = 'block';
        loginFormContainer.style.display = 'block';
        signupFormContainer.style.display = 'none';
    });
    loginFormContainer.style.display = 'block';
    signupFormContainer.style.display = 'none';
}

function showLoggedInUI(displayName) {
    userSection.innerHTML = `
        <span class="text-white me-2">Welcome, <strong>${displayName}</strong>!</span>
        <button id="logout-btn" class="btn btn-outline-light btn-sm">Logout</button>
    `;
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        signOut(auth).catch(error => console.error("Logout error:", error));
    });
}

// Toggle between Login and Signup forms
showSignupLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginFormContainer.style.display = 'none';
    signupFormContainer.style.display = 'block';
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    signupFormContainer.style.display = 'none';
    loginFormContainer.style.display = 'block';
});

// Email/Password Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    signInWithEmailAndPassword(auth, email, password)
        .catch((error) => {
            console.error("Login error:", error);
            alert(`Login failed: ${error.message}`);
        });
});

// Email/Password Signup
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    if (username.length < 3) {
        alert("Username must be at least 3 characters long.");
        return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        alert("Username can only contain letters, numbers, and underscores.");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Signup successful, user created:", user.uid);

        await setDoc(doc(db, "users", user.uid), {
            username: username,
            email: user.email,
            createdAt: serverTimestamp()
        });
        console.log("User profile created in Firestore for:", username);
    } catch (error) {
        console.error("Signup error:", error);
        if (error.code === 'auth/email-already-in-use') {
            alert('This email address is already registered. Please login or use a different email.');
        } else if (error.code === 'auth/weak-password') {
             alert('Password is too weak. Please use at least 6 characters.');
        } else {
            alert(`Signup failed: ${error.message}`);
        }
    }
});


// --- User Data Handling ---

async function fetchAndCacheUserData(userId) {
    if (!userId) return null;
    if (userDataCache[userId]) {
        return userDataCache[userId];
    }
    try {
        const userDocRef = doc(db, "users", userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            userDataCache[userId] = userDocSnap.data();
            return userDataCache[userId];
        } else {
            console.warn("User document not found for ID:", userId);
             try {
                const authUser = auth.currentUser;
                if (authUser && authUser.uid === userId) {
                    const derivedUsername = authUser.email.split('@')[0];
                    await setDoc(userDocRef, {
                        username: derivedUsername,
                        email: authUser.email,
                        createdAt: serverTimestamp()
                    });
                    userDataCache[userId] = { username: derivedUsername, email: authUser.email };
                    console.log("Created fallback user profile for:", userId);
                    return userDataCache[userId];
                }
            } catch (creationError) {
                 console.error("Error creating fallback user profile:", creationError);
            }
            return null;
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
    }
}

async function getUserDisplayData(userId) {
    const userData = await fetchAndCacheUserData(userId);
    return {
        username: userData?.username || 'Unknown User',
        userId: userId
    };
}


// --- Issues Handling ---

function clearIssueListeners() {
    issueListeners.forEach(unsubscribe => unsubscribe());
    issueListeners = [];
}

async function loadIssues(neighborhood) {
    console.log(`Loading issues for: ${neighborhood}`);
    issuesContainer.innerHTML = '<div class="text-center p-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    currentNeighborhood = neighborhood;
    clearIssueListeners();

    try {
        const issuesQuery = query(
            collection(db, "issues"),
            where("neighborhood", "==", neighborhood),
            orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(issuesQuery);

        if (querySnapshot.empty) {
            issuesContainer.innerHTML = '<p class="text-center fst-italic mt-4">No issues reported in this area yet. Be the first!</p>';
            return;
        }

        issuesContainer.innerHTML = '';

        const issueDataPromises = querySnapshot.docs.map(async (issueDoc) => {
            const issue = issueDoc.data();
            const issueId = issueDoc.id;
            const displayData = await getUserDisplayData(issue.userId);
            return { issue, issueId, displayData };
        });

        const issuesWithData = await Promise.all(issueDataPromises);
        issuesWithData.sort((a, b) => (b.issue.votes || 0) - (a.issue.votes || 0));

        issuesWithData.forEach(({ issue, issueId, displayData }) => {
            const issueCard = document.createElement('div');
            issueCard.className = 'issue-card shadow-sm';
            issueCard.innerHTML = `
                <div class="vote-section">
                    <button class="vote-btn upvote-btn" data-id="${issueId}" ${!currentUser ? 'disabled' : ''} title="Upvote">
                        <i class="bi bi-arrow-up-short"></i>
                    </button>
                    <span class="vote-count">${issue.votes || 0}</span>
                    <button class="vote-btn downvote-btn" data-id="${issueId}" ${!currentUser ? 'disabled' : ''} title="Downvote">
                        <i class="bi bi-arrow-down-short"></i>
                    </button>
                </div>
                <div class="issue-content">
                    <div class="issue-meta">
                        Posted by <strong>${displayData.username}</strong>
                        ${issue.createdAt ? ` - ${formatTimeAgo(issue.createdAt.toDate())}` : ''}
                    </div>
                    <h5 class="card-title mb-1">${issue.title}</h5>
                    <p class="card-text">${issue.description}</p>
                    <div class="comment-section">
                        <h6><i class="bi bi-chat-dots"></i> Comments</h6>
                        <div class="comments-list mb-2" id="comments-${issueId}">
                            <small class="text-muted ps-2">Loading comments...</small>
                        </div>
                        ${currentUser ? `
                        <form class="add-comment-form" data-id="${issueId}">
                            <div class="input-group input-group-sm">
                                <input type="text" class="form-control comment-input" placeholder="Add a comment..." required>
                                <button class="btn btn-outline-secondary" type="submit">Post</button>
                            </div>
                        </form>
                        ` : '<p class="text-muted small ps-2"><i>Login to comment.</i></p>'}
                    </div>
                </div>
            `;
            issuesContainer.appendChild(issueCard);
            loadComments(issueId); // Load comments for this issue
        });

        attachVoteListeners();
        attachAddCommentFormListeners(); // Attach listeners for the main comment forms

    } catch (error) {
        console.error("Error loading issues:", error);
        issuesContainer.innerHTML = `<p class="text-center text-danger mt-4">Error loading issues: ${error.message}</p>`;
    }
}

function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + " year" + (interval > 1 ? "s" : "") + " ago";
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + " month" + (interval > 1 ? "s" : "") + " ago";
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + " day" + (interval > 1 ? "s" : "") + " ago";
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + " hour" + (interval > 1 ? "s" : "") + " ago";
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + " minute" + (interval > 1 ? "s" : "") + " ago";
    return Math.max(0, Math.floor(seconds)) + " second" + (seconds !== 1 ? "s" : "") + " ago";
}


function attachVoteListeners() {
    document.querySelectorAll('.vote-btn').forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        if (!newButton.disabled) {
             newButton.addEventListener('click', handleVote);
        }
    });
}

async function handleVote(e) {
    if (!currentUser) {
        alert("Please login to vote.");
        return;
    }

    const button = e.currentTarget;
    const voteSection = button.closest('.vote-section');
    const issueId = button.dataset.id;
    const isUpvote = button.classList.contains('upvote-btn');
    const voteValue = isUpvote ? 1 : -1;

    const upvoteBtn = voteSection.querySelector('.upvote-btn');
    const downvoteBtn = voteSection.querySelector('.downvote-btn');
    upvoteBtn.disabled = true;
    downvoteBtn.disabled = true;

    console.log(`Voting ${voteValue > 0 ? 'up' : 'down'} on issue ${issueId}`);

    try {
        const issueRef = doc(db, "issues", issueId);
        await updateDoc(issueRef, {
            votes: increment(voteValue)
        });

        const countElement = voteSection.querySelector('.vote-count');
        const currentVotes = parseInt(countElement.textContent) || 0;
        countElement.textContent = currentVotes + voteValue;

        upvoteBtn.classList.remove('voted');
        downvoteBtn.classList.remove('voted');
        if (isUpvote) {
            upvoteBtn.classList.add('voted');
        } else {
            downvoteBtn.classList.add('voted');
        }
        console.log(`Vote successful for issue ${issueId}`);
    } catch (error) {
        console.error("Error voting:", error);
        alert(`Error voting: ${error.message}`);
        upvoteBtn.disabled = false;
        downvoteBtn.disabled = false;
    }
}

newIssueBtn.addEventListener('click', () => {
    if (!currentUser) {
        alert("Please login to report an issue.");
        return;
    }
    newIssueFormContainer.style.display = 'block';
    newIssueBtn.style.display = 'none';
});

cancelIssueBtn.addEventListener('click', () => {
    newIssueFormContainer.style.display = 'none';
    newIssueBtn.style.display = 'block';
    issueForm.reset();
});

issueForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) {
        alert("Authentication error. Please login again.");
        return;
    }

    const title = document.getElementById('issue-title').value.trim();
    const description = document.getElementById('issue-description').value.trim();

    if (!title || !description) {
        alert("Please fill out both title and description.");
        return;
    }

    const submitButton = issueForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
        await addDoc(collection(db, "issues"), {
            title: title,
            description: description,
            neighborhood: currentNeighborhood,
            userId: currentUser.uid,
            votes: 0,
            createdAt: serverTimestamp()
        });

        console.log("Issue created successfully");
        issueForm.reset();
        newIssueFormContainer.style.display = 'none';
        newIssueBtn.style.display = 'block';
        loadIssues(currentNeighborhood);
    } catch (error) {
        console.error("Error creating issue:", error);
        alert(`Error creating issue: ${error.message}`);
    } finally {
        submitButton.disabled = false;
    }
});

neighborhoodFilter.addEventListener('change', () => {
    loadIssues(neighborhoodFilter.value);
});

// --- Comments Handling ---

// Attach listeners to the main "Add Comment" forms
function attachAddCommentFormListeners() {
     document.querySelectorAll('.add-comment-form').forEach(form => {
        const newForm = form.cloneNode(true); // Clone to safely replace
        form.parentNode.replaceChild(newForm, form);
        newForm.addEventListener('submit', handleAddComment);
    });
}

// Load comments for a specific issue using real-time updates
function loadComments(issueId) {
    const commentsListContainer = document.getElementById(`comments-${issueId}`);
    if (!commentsListContainer) {
        console.warn("Comments list container not found for:", issueId);
        return;
    }

    const commentsQuery = query(
        collection(db, "comments"),
        where("issueId", "==", issueId),
        orderBy("createdAt", "asc")
    );

    // Use onSnapshot for real-time updates
    const unsubscribe = onSnapshot(commentsQuery, async (querySnapshot) => {
        if (!commentsListContainer) return; // Check again in case element disappeared

        if (querySnapshot.empty) {
            commentsListContainer.innerHTML = '<small class="text-muted fst-italic ps-2">No comments yet.</small>';
            return;
        }

        commentsListContainer.innerHTML = ''; // Clear previous comments or loading message

        const commentDataPromises = querySnapshot.docs.map(async (commentDoc) => {
            const comment = commentDoc.data();
            const commentId = commentDoc.id;
            const displayData = await getUserDisplayData(comment.userId);
            return { comment, commentId, displayData };
        });

        const commentsWithData = await Promise.all(commentDataPromises);

        commentsWithData.forEach(({ comment, commentId, displayData }) => {
            const commentDiv = document.createElement('div');
            commentDiv.className = 'comment mb-2';
            commentDiv.id = `comment-${commentId}`; // Add ID for targeting edits/deletes

            const isAuthor = currentUser && currentUser.uid === comment.userId;

            commentDiv.innerHTML = `
                <div class="comment-content">
                    <p class="comment-text mb-1">${comment.text}</p>
                    <div class="comment-meta">
                        By <strong>${displayData.username}</strong> - ${comment.createdAt ? formatTimeAgo(comment.createdAt.toDate()) : 'just now'}
                        ${isAuthor ? `
                            <button class="btn btn-link btn-sm p-0 ms-2 edit-comment-btn" data-comment-id="${commentId}" title="Edit Comment">
                                <i class="bi bi-pencil-square"></i> Edit
                            </button>
                            <button class="btn btn-link btn-sm p-0 ms-1 text-danger delete-comment-btn" data-comment-id="${commentId}" title="Delete Comment">
                                <i class="bi bi-trash"></i> Delete
                            </button>
                        ` : ''}
                    </div>
                </div>
                ${isAuthor ? `
                <div class="edit-comment-form mt-1" style="display: none;">
                    <textarea class="form-control form-control-sm mb-1 edit-comment-textarea" rows="2">${comment.text}</textarea>
                    <button class="btn btn-sm btn-primary save-edit-btn" data-comment-id="${commentId}">Save</button>
                    <button type="button" class="btn btn-sm btn-outline-secondary cancel-edit-btn" data-comment-id="${commentId}">Cancel</button>
                </div>
                ` : ''}
            `;
            commentsListContainer.appendChild(commentDiv);
        });

        // Attach listeners for edit/delete AFTER comments are added to this specific list
        attachCommentActionListeners(commentsListContainer);

    }, (error) => {
        console.error(`Error loading comments for issue ${issueId}:`, error);
        if (commentsListContainer) {
            commentsListContainer.innerHTML = '<small class="text-danger ps-2">Error loading comments.</small>';
        }
    });

    issueListeners.push(unsubscribe); // Store unsubscribe function
}

// Attach listeners for edit/delete buttons using delegation
function attachCommentActionListeners(commentsListContainer) {
    if (!commentsListContainer) return;

    // Use a unique identifier for the listener if needed, or simply remove/add
    const listenerKey = `commentActionListener_${commentsListContainer.id}`;

    // Remove previous listener if it exists (using a simple flag or attribute)
    if (commentsListContainer.dataset[listenerKey]) {
         commentsListContainer.removeEventListener('click', handleCommentActionClick);
         delete commentsListContainer.dataset[listenerKey];
    }

    // Add new listener
    commentsListContainer.addEventListener('click', handleCommentActionClick);
    commentsListContainer.dataset[listenerKey] = 'true'; // Mark that listener is attached
}

// Handle clicks within the comments list (delegated)
function handleCommentActionClick(e) {
    const button = e.target.closest('button'); // Find the closest button clicked
    if (!button) return; // Exit if click wasn't on or inside a button

    const commentId = button.dataset.commentId;
    if (!commentId) return; // Exit if button doesn't have a commentId

    if (button.classList.contains('delete-comment-btn')) {
        handleDeleteComment(commentId);
    } else if (button.classList.contains('edit-comment-btn')) {
        showEditForm(commentId);
    } else if (button.classList.contains('save-edit-btn')) {
        handleSaveEdit(commentId);
    } else if (button.classList.contains('cancel-edit-btn')) {
        hideEditForm(commentId);
    }
}

// Function to delete a comment
async function handleDeleteComment(commentId) {
    if (!currentUser) {
        alert("Please login.");
        return;
    }
    if (!confirm("Are you sure you want to delete this comment?")) {
        return;
    }

    console.log("Attempting to delete comment:", commentId);
    const deleteButton = document.querySelector(`.delete-comment-btn[data-comment-id="${commentId}"]`);
    if(deleteButton) deleteButton.disabled = true; // Disable button immediately

    try {
        const commentRef = doc(db, "comments", commentId);
        // Optional: Verify ownership server-side via rules, client-side check is less secure
        await deleteDoc(commentRef);
        console.log("Comment deleted successfully:", commentId);
        // UI update is handled by onSnapshot
    } catch (error) {
        console.error("Error deleting comment:", error);
        alert(`Failed to delete comment: ${error.message}`);
         if(deleteButton) deleteButton.disabled = false; // Re-enable on error
    }
}

// Function to show the edit form for a comment
function showEditForm(commentId) {
    const commentElement = document.getElementById(`comment-${commentId}`);
    if (!commentElement) return;

    const contentDiv = commentElement.querySelector('.comment-content');
    const editFormDiv = commentElement.querySelector('.edit-comment-form');
    const editTextArea = editFormDiv.querySelector('.edit-comment-textarea');
    const originalText = contentDiv.querySelector('.comment-text').textContent;

    editTextArea.value = originalText;
    contentDiv.style.display = 'none';
    editFormDiv.style.display = 'block';
    editTextArea.focus();
}

// Function to hide the edit form
function hideEditForm(commentId) {
     const commentElement = document.getElementById(`comment-${commentId}`);
    if (!commentElement) return;

    const contentDiv = commentElement.querySelector('.comment-content');
    const editFormDiv = commentElement.querySelector('.edit-comment-form');

    editFormDiv.style.display = 'none';
    contentDiv.style.display = 'block';
}

// Function to save the edited comment
async function handleSaveEdit(commentId) {
     if (!currentUser) {
        alert("Please login.");
        return;
    }
    const commentElement = document.getElementById(`comment-${commentId}`);
    if (!commentElement) return;

    const editTextArea = commentElement.querySelector('.edit-comment-textarea');
    const newText = editTextArea.value.trim();
    const saveButton = commentElement.querySelector('.save-edit-btn');
    const cancelButton = commentElement.querySelector('.cancel-edit-btn');

    if (!newText) {
        alert("Comment cannot be empty.");
        return;
    }

    saveButton.disabled = true;
    cancelButton.disabled = true;
    editTextArea.disabled = true;

    console.log("Attempting to save edit for comment:", commentId);
    try {
        const commentRef = doc(db, "comments", commentId);
        // Optional: Verify ownership server-side via rules
        await updateDoc(commentRef, {
            text: newText
            // Optionally add/update an 'editedAt: serverTimestamp()' field
        });
        console.log("Comment edit saved successfully:", commentId);
        hideEditForm(commentId); // Hide form on success
        // UI update is handled by onSnapshot
    } catch (error) {
        console.error("Error saving comment edit:", error);
        alert(`Failed to save edit: ${error.message}`);
    } finally {
        // Re-enable form elements
        saveButton.disabled = false;
        cancelButton.disabled = false;
        editTextArea.disabled = false;
    }
}

// Handle adding a new comment (main form submission)
async function handleAddComment(e) {
    e.preventDefault();
    if (!currentUser) {
        alert("Please login to comment.");
        return;
    }

    const form = e.currentTarget;
    const issueId = form.dataset.id;
    const commentInput = form.querySelector('.comment-input');
    const commentText = commentInput.value.trim();

    if (!commentText) {
        return; // Don't submit empty comments
    }

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    commentInput.disabled = true;

    try {
        await addDoc(collection(db, "comments"), {
            issueId: issueId,
            text: commentText,
            userId: currentUser.uid,
            createdAt: serverTimestamp()
        });

        console.log("Comment added successfully for issue:", issueId);
        commentInput.value = ''; // Clear input field
        // Real-time listener (onSnapshot) will update the UI
    } catch (error) {
        console.error("Error adding comment:", error);
        alert(`Error adding comment: ${error.message}`);
    } finally {
         submitButton.disabled = false;
         commentInput.disabled = false;
    }
}


// --- Initial Load ---
loadIssues(currentNeighborhood); // Load issues for the default neighborhood