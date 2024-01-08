// StorageBackend.ts
/**
 * Interface for storage backends.
 */
interface StorageBackend {
    id: string;
    save(project: Project): void;
    load(projectId: string): Project | null;
    listAll(): ConcatArray<Project>;
}

// CookieStorage.ts
/**
 * Class for cookie storage backend.
 */
class CookieStorage implements StorageBackend {
    id = 'cookie';

    /**
     * Save a project to cookies.
     * @param {Project} project - The project to save.
     */
    save(project: Project) {
        document.cookie = `${project.id}=${encodeURIComponent(JSON.stringify(project))};`;
    }

    /**
     * Load a project from cookies.
     * @param {string} projectId - The ID of the project to load.
     * @return {Project | null} The loaded project, or null if not found.
     */
    load(projectId: string) {
        const cookies = document.cookie.split('; ');
        const projectCookie = cookies.find(row => row.startsWith(projectId));

        return projectCookie ? JSON.parse(decodeURIComponent(projectCookie.split('=')[1])) : null;
    }

    /**
     * List all projects from cookies.
     * @return {Project[]} The list of projects.
     */
    listAll(): Project[] {
        const cookies = document.cookie.split('; ');
        return cookies.map(cookie => JSON.parse(decodeURIComponent(cookie.split('=')[1])));
    }
}

// UriStorage.ts
/**
 * Class for URI storage backend.
 */
class UriStorage implements StorageBackend {
    id = 'uri';

    /**
     * Save a project to URI.
     * @param {Project} project - The project to save.
     */
    save(project: Project) {
        window.location.hash = `${project.id}=${encodeURIComponent(JSON.stringify(project))}`;
    }

    /**
     * Load a project from URI.
     * @param {string} projectId - The ID of the project to load.
     * @return {Project | null} The loaded project, or null if not found.
     */
    load(projectId: string) {
        const hash = window.location.hash.substr(1);
        const projectUri = hash.split('&').find(row => row.startsWith(projectId));

        return projectUri ? JSON.parse(decodeURIComponent(projectUri.split('=')[1])) : null;
    }

    /**
     * List the project from URI.
     * @return {Project[]} The list of projects.
     */
    listAll(): Project[] {
        const hash = window.location.hash.substr(1);
        const projectUri = hash.split('&').find(row => row.includes('='));
        const project = projectUri ? JSON.parse(decodeURIComponent(projectUri.split('=')[1])) : null;

        return project ? [project] : [];
    }
}

// TODO: Implement LocalStorage, IndexedDB, Service Worker classes

// Project.ts
/**
 * Class for a project.
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
 * Class for the main storage module.
 */
class StorageModule {
    backends: StorageBackend[];

    constructor(backends: StorageBackend[]) {
        this.backends = backends;
    }

    /**
     * List all available projects.
     * @return {Project[]} The list of projects.
     */
    listProjects(): Project[] {
        let projects: Project[] = [];
        this.backends.forEach(backend => {
            // TODO: Implement listAll method in each backend
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
            if (project) return project;
        }
        return null;
    }

    /**
     * Save a project.
     * @param {Project} project - The project to save.
     */
    saveProject(project: Project) {
        this.backends.forEach(backend => backend.save(project));
    }
}

// app.ts
const module = new StorageModule([
    new CookieStorage(),
    new UriStorage(),
    // Other storage backends
]);

document.getElementById('saveButton').addEventListener('click', () => {
    const projectId = (document.getElementById('projectId') as HTMLInputElement).value;
    const projectData = (document.getElementById('projectData') as HTMLTextAreaElement).value;
    const project = new Project(projectId, projectData, []);
    module.saveProject(project);
});

// Load projects on page load
window.onload = () => {
    const projects = module.listProjects();
    const projectList = document.getElementById('projectList');
    projects.forEach(project => {
        const listItem = document.createElement('li');
        listItem.textContent = project.id;
        projectList.appendChild(listItem);
    });
};