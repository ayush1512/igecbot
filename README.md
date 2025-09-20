https://t.me/itigecbot

# 📁 Project Structure
>Models (models)
> - File.js - Database model for file storage with methods for querying and statistics
> - UserStats.js - Database model for user interaction tracking
>
>Views (views)
> - fileView.js - All file-related messages and keyboards
> - userView.js - All user-related messages and keyboards
>
>Controllers (controllers)
> - botController.js - Main business logic handling all bot commands and interactions
>
>Services (services)
> - database.js - Database connection and management
>
>Routes (routes)
> - botRoutes.js - Route definitions connecting commands to controller methods

# 🔧 Key Benefits
> - Separation of Concerns - Each component has a specific responsibility
> - Maintainability - Easy to modify messages, add features, or change business logic
> - Reusability - Views and models can be reused across different parts of the application
> - Testability - Each component can be tested independently
> - Scalability - Easy to add new features following the same pattern

