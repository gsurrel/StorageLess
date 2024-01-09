// StorageBackend.ts
/**
 * Interface for storage backends.
 */
interface StorageBackend {
    save(project: Project): void;
    load(projectId: string): Project | null;
    listAll(): ConcatArray<Project>;
}

// CookieStorage.ts
/**
 * Class for cookie storage backend.
 */
class CookieStorage implements StorageBackend {

    /**
     * Save a project to cookies.
     * @param {Project} project - The project to save.
     */
    save(project: Project) {
        try {
            document.cookie = `${project.id}=${encodeURIComponent(JSON.stringify(project))};`;
        } catch (error) {
            console.error(`Failed to save project with id ${project.id} to cookies:`, error);
        }
    }

    /**
     * Load a project from cookies.
     * @param {string} projectId - The ID of the project to load.
     * @return {Project | null} The loaded project, or null if not found.
     */
    load(projectId: string) {
        try {
            const cookies = document.cookie.split('; ');
            const projectCookie = cookies.find(row => row.startsWith(projectId));

            return projectCookie ? JSON.parse(decodeURIComponent(projectCookie.split('=')[1])) : null;
        } catch (error) {
            console.error(`Failed to load project with id ${projectId} from cookies:`, error);
            return null;
        }
    }

    /**
     * List all projects from cookies.
     * @return {Project[]} The list of projects.
     */
    listAll(): Project[] {
        try {
            const cookies = document.cookie.split('; ');
            return cookies.map(cookie => JSON.parse(decodeURIComponent(cookie.split('=')[1])));
        } catch (error) {
            console.error('Failed to list all projects from cookies:', error);
            return [];
        }
    }
}

// UriStorage.ts
/**
 * Class for URI storage backend.
 */
class UriStorage implements StorageBackend {

    /**
     * Save a project to URI.
     * @param {Project} project - The project to save.
     */
    save(project: Project) {
        try {
            window.location.hash = `${project.id}=${encodeURIComponent(JSON.stringify(project))}`;
        } catch (error) {
            console.error(`Failed to save project with id ${project.id} to URI:`, error);
        }
    }

    /**
     * Load a project from URI.
     * @param {string} projectId - The ID of the project to load.
     * @return {Project | null} The loaded project, or null if not found.
     */
    load(projectId: string) {
        try {
            const hash = window.location.hash.substr(1);
            const projectUri = hash.split('&').find(row => row.startsWith(projectId));

            return projectUri ? JSON.parse(decodeURIComponent(projectUri.split('=')[1])) : null;
        } catch (error) {
            console.error(`Failed to load project with id ${projectId} from URI:`, error);
            return null;
        }
    }

    /**
     * List the project from URI.
     * @return {Project[]} The list of projects.
     */
    listAll(): Project[] {
        try {
            const hash = window.location.hash.substr(1);
            const projectUri = hash.split('&').find(row => row.includes('='));
            const project = projectUri ? JSON.parse(decodeURIComponent(projectUri.split('=')[1])) : null;

            return project ? [project] : [];
        } catch (error) {
            console.error('Failed to list project from URI:', error);
            return [];
        }
    }
}

// TODO: Implement LocalStorage, IndexedDB, Service Worker classes

// Project.ts
/**
 * Class for a project.
 * @property {string} id - The ID of the project.
 * @property {string} data - The data of the project.
 * @property {Version[]} versions - The versions of the project.
 */
class Project {
    id: string;
    data: string;
    versions: Version[];

    constructor(id: string, data: string, versions: Version[]) {
        this.id = id;
        this.data = data;
        this.versions = versions;
    }
}

// Version.ts
/**
 * Class for a version.
 * @property {string} hash - The hash of the version.
 * @property {number} timestamp - The timestamp of the version.
 */
class Version {
    hash: string;
    timestamp: number;

    constructor(hash: string, timestamp: number) {
        this.hash = hash;
        this.timestamp = timestamp;
    }
}

// StorageModule.ts
/**
 * Class for a storage module.
 * @property {StorageBackend[]} backends - The backends of the storage module.
 */
class StorageModule {
    backends: StorageBackend[];

    constructor(backends: StorageBackend[]) {
        this.backends = backends;
        console.log("StorageModule is ready.");
    }

    /**
     * List all projects.
     * @return {Project[]} The list of all projects.
     */
    listProjects(): Project[] {
        let projects: Project[] = [];
        this.backends.forEach(backend => {
            projects = projects.concat(backend.listAll());
        });
        return projects;
    }

    /**
     * Fetch a project.
     * @param {string} id - The ID of the project to fetch.
     * @return {Project | null} The fetched project, or null if not found.
     */
    fetchProject(id: string): Project | null {
        for (let backend of this.backends) {
            const project = backend.load(id);
            if (project) {
                return project;
            }
        }
        return null;
    }

    /**
     * Save a project.
     * @param {Project} project - The project to save.
     */
    saveProject(project: Project) {
        this.backends.forEach(backend => {
            try {
                backend.save(project);
            } catch (error) {
                console.error(`Failed to save project to ${backend.constructor.name}:`, error);
            }
        });
    }
}


// app.ts
const backends = [
    new CookieStorage(),
    new UriStorage(),
    // Other storage backends
];
const module = new StorageModule(
    backends,
);

const projectList = document.getElementById('projectList');

// Function to load and display projects
function loadProjects() {
    console.log("Loading projects from the following backends:");
    projectList.innerHTML = '';
    backends.forEach((backend, index) => {
        console.log(`Backend ${index + 1}: ${backend.constructor.name}`);
        const projects = backend.listAll();
        // Clear the list before adding new items
        projects.forEach(project => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<b>${backend.constructor.name}</b> Project ID: <code>${project.id}</code>, Project Data: <code>${project.data}</code>, Versions: ${project.versions.map(version => `Hash: <code>${version.hash}</code>, Timestamp: <code>${version.timestamp}</code>`).join(', ')}`;
            projectList.appendChild(listItem);
            console.log(`Loaded project with ID: ${project.id} from backend: ${backend.constructor.name}`);
        });
    });
}

document.getElementById('saveButton').addEventListener('click', () => {
    const projectId = (document.getElementById('projectId') as HTMLInputElement).value;
    const projectData = (document.getElementById('projectData') as HTMLTextAreaElement).value;
    const project = new Project(projectId, projectData, []);
    module.saveProject(project);
    console.log(`Project ${projectId} saved.`);
    // Load projects after saving
    loadProjects();
})

// Load projects when the page loads
loadProjects();
