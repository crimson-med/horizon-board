/**
 * Search utility for filtering stories based on search criteria
 */
export class SearchUtility {
  /**
   * Generate search bar HTML
   * @returns HTML for the search bar
   */
  public static generateSearchBarHtml(): string {
    return `
      <div class="search-container">
        <input type="text" id="search-input" placeholder="Search stories..." class="search-input">
        <button id="search-clear" class="search-clear" title="Clear search">×</button>
      </div>
    `;
  }

  /**
   * Generate the JavaScript needed for search functionality
   * @returns JavaScript code as a string to be inserted into the webview
   */
  public static generateSearchScript(): string {
    return `
      // Search functionality
      function initializeSearch() {
        const searchInput = document.getElementById('search-input');
        const searchClear = document.getElementById('search-clear');
        
        if (!searchInput || !searchClear) return;
        
        // Function to filter stories based on search text
        function filterStories(searchText) {
          if (!searchText) {
            // If search is empty, show all stories
            document.querySelectorAll('.story-item').forEach(item => {
              item.style.display = 'block';
            });
            
            // Show empty messages only if columns are actually empty
            document.querySelectorAll('.horizon-items').forEach(column => {
              const hasVisibleStories = column.querySelectorAll('.story-item').length > 0;
              const emptyMessage = column.querySelector('.empty-message');
              if (emptyMessage) {
                emptyMessage.style.display = hasVisibleStories ? 'none' : 'block';
              }
            });
            
            return;
          }
          
          // Convert to lowercase for case-insensitive search
          searchText = searchText.toLowerCase();
          
          // Get all story items
          const storyItems = document.querySelectorAll('.story-item');
          
          // Track which columns have visible stories
          const columnsWithVisibleStories = new Set();
          
          // Filter based on ID and title
          storyItems.forEach(item => {
            const storyId = item.querySelector('.story-id').textContent.toLowerCase();
            const storyTitle = item.querySelector('.story-title').textContent.toLowerCase();
            
            // Check if either ID or title contains the search text
            const matches = storyId.includes(searchText) || storyTitle.includes(searchText);
            
            // Show or hide the story based on match
            item.style.display = matches ? 'block' : 'none';
            
            // If it matches, mark its column as having visible stories
            if (matches) {
              const column = item.closest('.horizon-items');
              if (column) {
                columnsWithVisibleStories.add(column);
              }
            }
          });
          
          // Update empty messages
          document.querySelectorAll('.horizon-items').forEach(column => {
            const hasVisibleStories = Array.from(column.querySelectorAll('.story-item'))
              .some(item => item.style.display !== 'none');
              
            // Get or create empty message
            let emptyMessage = column.querySelector('.empty-message');
            if (!emptyMessage && !hasVisibleStories) {
              emptyMessage = document.createElement('div');
              emptyMessage.className = 'empty-message';
              emptyMessage.textContent = 'No matching stories';
              column.appendChild(emptyMessage);
            } else if (emptyMessage) {
              // Update existing empty message
              if (hasVisibleStories) {
                emptyMessage.style.display = 'none';
              } else {
                emptyMessage.style.display = 'block';
                emptyMessage.textContent = 'No matching stories';
              }
            }
          });
        }
        
        // Add event listener to search input
        searchInput.addEventListener('input', (e) => {
          const searchText = e.target.value.trim();
          filterStories(searchText);
          
          // Show/hide the clear button
          searchClear.style.display = searchText ? 'block' : 'none';
        });
        
        // Add event listener to clear button
        searchClear.addEventListener('click', () => {
          searchInput.value = '';
          filterStories('');
          searchClear.style.display = 'none';
          searchInput.focus();
        });
        
        // Initialize clear button visibility
        searchClear.style.display = 'none';
      }
      
      // Initialize search when DOM is loaded
      document.addEventListener('DOMContentLoaded', initializeSearch);
      
      // Also initialize search immediately in case DOM is already loaded
      initializeSearch();
    `;
  }
}
