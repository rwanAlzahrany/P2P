// script.js (Updated for Backend Integration)
/*=============== CONSTANTS ===============*/
const BASE_URL = 'http://localhost:3000/api/posts';

/*=============== SIDEBAR ACTIVE LINK ===============*/
const navLink = document.querySelectorAll('.nav__link');
function linkColor() { 
  navLink.forEach(link => link.classList.remove('active-link')); 
  this.classList.add('active-link'); 
}
navLink.forEach(link => link.addEventListener('click', linkColor));

/*=============== FRONT-END ELEMENTS ===============*/
const postBtn = document.getElementById('postBtn');
const postModal = document.getElementById('postModal');
const closeModal = document.getElementById('closeModal');
const submitSkill = document.getElementById('submitSkill');
const skillTextarea = document.getElementById('skillTextarea');
const postsContainer = document.getElementById('postsContainer');
const postTitle = document.getElementById('postTitle');
const postType = document.getElementById('postType');
const postCategory = document.getElementById('postCategory');

const searchBar = document.getElementById("searchBar");
const suggestionUL = document.getElementById("suggestion");

/*=============== SAMPLE ITEMS FOR SEARCH (Used for suggestions only) ===============*/
const items = [
  { name: "JavaScript", category: "Coding" },
  { name: "Python", category: "Coding" },
  { name: "C++", category: "Coding" },
  { name: "Algebra", category: "Math" },
  { name: "Calculus", category: "Math" },
  { name: "Geometry", category: "Math" },
  { name: "Physics", category: "Science" },
  { name: "Chemistry", category: "Science" },
  { name: "Biology", category: "Science" },
];

/*=============== POST / EDIT STATE ===============*/
let editingPost = null; // Holds the post object { _id, ... } when editing

/*=============== MODAL BEHAVIOR ===============*/
postBtn.addEventListener('click', () => {
  postModal.style.display = 'flex';
  postModal.setAttribute('aria-hidden', 'false');
  skillTextarea.focus();
});

closeModal.addEventListener('click', resetModal);

// reset modal fields and close
function resetModal(){
  postModal.style.display = 'none';
  postModal.setAttribute('aria-hidden', 'true');
  skillTextarea.value = '';
  postTitle.value = '';
  postType.value = 'request';
  postCategory.value = '';
  editingPost = null;
  document.getElementById('modalTitle').textContent = 'Create a Skill Post';
}

/*=============== POST CARD CREATION ===============*/
function createPostElement(post) {
    const { _id, title, type, category, description } = post;

    const displayType = type.charAt(0).toUpperCase() + type.slice(1);
    const displayCategory = category ? category.charAt(0).toUpperCase() + category.slice(1) : '';

    const postDiv = document.createElement('div');
    postDiv.classList.add('post');
    postDiv.dataset.id = _id; // Store MongoDB ID on the DOM element

    const postHeading = document.createElement('h4');
    postHeading.textContent = title;

    const postMeta = document.createElement('div');
    postMeta.classList.add('post-meta');
    postMeta.innerHTML = `<span>${displayType} | ${displayCategory}</span> <span class="three-dots">⋮</span>`;

    const postText = document.createElement('p');
    postText.textContent = description;

    // Dropdown for actions
    const dropdown = document.createElement('div');
    dropdown.classList.add('post-dropdown');
    dropdown.innerHTML = `
        <button class="edit-btn"><i class="ri-edit-line"></i> Edit</button>
        <button class="delete-btn"><i class="ri-delete-bin-line"></i> Delete</button>
    `;

    postDiv.appendChild(postHeading);
    postDiv.appendChild(postMeta);
    postDiv.appendChild(postText);
    postDiv.appendChild(dropdown);

    // Wire up interactions
    const dots = postMeta.querySelector('.three-dots');
    const editBtn = dropdown.querySelector('.edit-btn');
    const deleteBtn = dropdown.querySelector('.delete-btn');

    // show/hide dropdown
    dots.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.post-dropdown').forEach(d => { 
            if (d !== dropdown) d.style.display = 'none'; 
        });
        dropdown.style.display = (dropdown.style.display === 'flex') ? 'none' : 'flex';
    });

    // Edit Post: Open Modal with data
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Set the state for editing
        editingPost = post; 
        document.getElementById('modalTitle').textContent = 'Edit Skill Post';

        postTitle.value = title;
        postType.value = type;
        postCategory.value = category;
        skillTextarea.value = description;

        postModal.style.display = 'flex';
        postModal.setAttribute('aria-hidden', 'false');
        dropdown.style.display = 'none';
        skillTextarea.focus();
    });

    // Delete Post: API call and DOM removal
    deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this post?')) {
            try {
                await fetch(`${BASE_URL}/${_id}`, { method: 'DELETE' });
                // Remove from DOM on success
                if (postDiv.parentElement) postsContainer.removeChild(postDiv);
            } catch (error) {
                console.error('Error deleting post:', error);
                alert('Could not delete post. Check console.');
            }
        }
    });

    return postDiv;
}

/*=============== CREATE / UPDATE POST (API CALL) ===============*/
submitSkill.addEventListener('click', async () => {
  const title = postTitle.value.trim();
  const type = postType.value.trim().toLowerCase();
  const category = postCategory.value.trim().toLowerCase() || 'other'; // default to 'other'
  const description = skillTextarea.value.trim();
  
  if (!title || !description || !postCategory.value) {
    alert('Please fill in Title, Type, Category, and Description.');
    return; 
  }

  const postData = { title, type, category, description };
  
  try {
    let response;
    let newOrUpdatedPost;

    if (editingPost) {
      // UPDATE Post (PUT request)
      response = await fetch(`${BASE_URL}/${editingPost._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });
      newOrUpdatedPost = await response.json();

      // Find the old DOM element and replace it with the new one
      const oldPostElement = document.querySelector(`[data-id="${editingPost._id}"]`);
      if (oldPostElement) {
        const updatedPostElement = createPostElement(newOrUpdatedPost);
        postsContainer.replaceChild(updatedPostElement, oldPostElement);
      }
      
    } else {
      // CREATE New Post (POST request)
      response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });
      newOrUpdatedPost = await response.json();

      // Prepend new post to the container
      postsContainer.prepend(createPostElement(newOrUpdatedPost));
    }

    if (!response.ok) {
        throw new Error(newOrUpdatedPost.message || 'Failed to process post');
    }

    resetModal();

  } catch (error) {
    console.error('Submission Error:', error);
    alert('Failed to save post. Please try again.');
  }
});

/*=============== FETCH ALL POSTS ON LOAD ===============*/
async function fetchPosts(searchTerm = '') {
    postsContainer.innerHTML = ''; // Clear existing posts

    let url = BASE_URL;
    if (searchTerm) {
        url = `${BASE_URL}/search?qry=${encodeURIComponent(searchTerm)}`;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch posts');
        const posts = await response.json();

        if (posts.length === 0) {
            postsContainer.innerHTML = '<p style="text-align: center; margin-top: 20px;">No posts found.</p>';
        } else {
            posts.forEach(post => {
                postsContainer.appendChild(createPostElement(post));
            });
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        postsContainer.innerHTML = '<p style="text-align: center; margin-top: 20px; color: red;">Error loading posts.</p>';
    }
}

// Initial load
document.addEventListener('DOMContentLoaded', fetchPosts);

/*=============== CLOSE DROPDOWNS ON OUTSIDE CLICK ===============*/
document.addEventListener('click', () => {
  document.querySelectorAll('.post-dropdown').forEach(d => d.style.display = 'none');
});

/*=============== SEARCH FEATURE (Suggestions & Backend Search) ===============*/
searchBar.addEventListener("keyup", (event) => {
    const qry = searchBar.value.toLowerCase().trim();
    
    // 1. Handle live search suggestions (from local 'items' array)
    const filtered = items.filter((item) => item.name.toLowerCase().includes(qry));
    suggestionUL.innerHTML = "";

    if (qry === "") {
        suggestionUL.classList.remove("show");
        // Also fetch all posts if the search bar is cleared
        fetchPosts(); 
        return;
    }

    suggestionUL.classList.add("show");
    const categories = ["Coding", "Math", "Science"];
    categories.forEach((cat) => {
        const catItems = filtered.filter((item) => item.category === cat);
        if (catItems.length > 0) {
            const header = document.createElement("li");
            header.textContent = cat;
            header.classList.add("category");
            suggestionUL.appendChild(header);

            catItems.slice(0, 3).forEach((item) => {
                const li = document.createElement("li");
                li.textContent = item.name;
                suggestionUL.appendChild(li);
            });
        }
    });

    // 2. Trigger actual backend search on Enter key press
    if (event.key === 'Enter') {
        fetchPosts(qry);
        suggestionUL.classList.remove("show");
    }
});


// click a suggestion to copy into search bar AND trigger search
suggestionUL.addEventListener("click", (event) => {
  if (event.target.tagName === "LI" && !event.target.classList.contains("category")) {
    const qry = event.target.textContent;
    searchBar.value = qry;
    suggestionUL.innerHTML = "";
    suggestionUL.classList.remove("show");
    fetchPosts(qry); // Trigger search on click
  }
});

// Hide suggestion if clicked outside search-box / suggestion
document.addEventListener("click", (event) => {
  if (!event.target.closest(".search-box") && !event.target.closest("#suggestion")) {
    suggestionUL.classList.remove("show");
  }
});