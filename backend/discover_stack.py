#!/usr/bin/env python3
"""Stack Overview Discovery Script.

Scans the project and outputs a structured capability registry as markdown.
Usage: python backend/discover_stack.py
Output: Markdown-formatted capability registry to stdout
"""

import json
import os
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path


def get_project_root() -> Path:
    """Get the project root directory (parent of the directory containing this script)."""
    script_dir = Path(__file__).resolve().parent
    return script_dir.parent


def read_file(path: Path) -> str | None:
    """Read a file and return its contents, or None if it doesn't exist."""
    try:
        return path.read_text()
    except (OSError, IOError):
        return None


def parse_package_json(path: Path) -> dict | None:
    """Parse package.json and return the dict, or None."""
    content = read_file(path)
    if content is None:
        return None
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return None


def detect_package_managers(project_root: Path) -> list[str]:
    """Detect package managers used in the project."""
    managers = []
    frontend_dir = project_root / "frontend"

    frontend_pkg = frontend_dir / "package.json"
    pkg = parse_package_json(frontend_pkg)

    if (frontend_dir / "pnpm-lock.yaml").exists() and pkg:
        managers.append("pnpm (frontend)")
    elif (frontend_dir / "package-lock.json").exists():
        managers.append("npm (frontend)")
    elif (frontend_dir / "yarn.lock").exists():
        managers.append("yarn (frontend)")

    backend_dir = project_root / "backend"
    if (backend_dir / "requirements.txt").exists():
        managers.append("pip (backend)")
    elif (backend_dir / "pyproject.toml").exists():
        managers.append("pip/uv (backend)")

    return managers


def detect_frontend(project_root: Path) -> dict:
    """Detect frontend framework, language, tools."""
    result = {}
    frontend_pkg = project_root / "frontend" / "package.json"
    pkg = parse_package_json(frontend_pkg)
    if not pkg:
        return result

    deps = pkg.get("dependencies", {})
    dev_deps = pkg.get("devDependencies", {})
    all_deps = {**deps, **dev_deps}

    # Framework
    if "next" in deps:
        result["framework"] = "Next.js"
        result["framework_version"] = deps["next"]

    # Language
    tsconfig = project_root / "frontend" / "tsconfig.json"
    result["language"] = "TypeScript" if tsconfig.exists() else "JavaScript"

    # Router
    next_config = project_root / "frontend" / "next.config.ts"
    if not next_config.exists():
        next_config = project_root / "frontend" / "next.config.js"
    if next_config.exists():
        content = read_file(next_config)
        if content and ("appDir" in content or '"app"' in content):
            result["router"] = "App Router"
        else:
            result["router"] = "Pages Router"

    # Styling
    if "tailwindcss" in all_deps or "@tailwindcss/postcss" in all_deps:
        result["styling"] = "Tailwind CSS"
    if "sass" in all_deps or "node-sass" in all_deps:
        result["preprocessor"] = "Sass"

    # Testing
    if "jest" in all_deps:
        result["testing"] = "Jest"
        result["testing_version"] = all_deps["jest"]
    if "vitest" in all_deps:
        result["testing"] = "Vitest"
    if "@testing-library/react" in all_deps:
        result["test_utilities"] = "React Testing Library"

    # Linting
    if "eslint" in all_deps:
        result["linting"] = result.get("linting", [])
        result["linting"].append("ESLint")
    if "stylelint" in all_deps:
        result["linting"] = result.get("linting", [])
        result["linting"].append("Stylelint")

    # Formatting
    if "prettier" in all_deps:
        result["formatting"] = "Prettier"
        result["formatting_version"] = all_deps["prettier"]

    # Key libraries (scoped packages)
    scoped_libs = [k for k in deps if k.startswith("@")]
    if scoped_libs:
        result["key_libraries"] = sorted(set(k.split("/")[0] for k in scoped_libs))

    # Icons
    if "lucide-react" in deps:
        result["icon_library"] = "Lucide React"
    if "react-icons" in deps:
        result["icon_library"] = "React Icons"

    return result


def detect_backend(project_root: Path) -> dict:
    """Detect backend framework, ORM, tools."""
    result = {}
    req_file = project_root / "backend" / "requirements.txt"
    content = read_file(req_file)
    if not content:
        return result

    packages = {}
    for line in content.splitlines():
        line = line.strip()
        if "==" in line and not line.startswith("#"):
            name, version = line.split("==", 1)
            packages[name.lower().strip()] = version.strip()

    if "fastapi" in packages:
        result["framework"] = "FastAPI"
        result["framework_version"] = packages["fastapi"]

    if "sqlalchemy" in packages:
        result["orm"] = "SQLAlchemy"
        result["orm_version"] = packages["sqlalchemy"]

    if "alembic" in packages:
        result["migrations"] = "Alembic"
        result["migrations_version"] = packages["alembic"]

    if "pytest" in packages:
        result["testing"] = "pytest"
        result["testing_version"] = packages["pytest"]

    if "mypy" in packages:
        result["type_checking"] = "mypy"
        result["type_checking_version"] = packages["mypy"]

    if "ruff" in packages:
        result["linting"] = "Ruff"

    if "uvicorn" in packages:
        result["server"] = "Uvicorn"

    if "pydantic" in packages:
        result["validation"] = "Pydantic"
        result["validation_version"] = packages["pydantic"]

    if "httpx" in packages:
        result["http_client"] = "httpx"

    if "python-dotenv" in packages:
        result["env_management"] = "python-dotenv"

    return result


def detect_tooling(project_root: Path) -> dict:
    """Detect project-level tooling."""
    result = {}

    # Monorepo
    frontend_dir = project_root / "frontend"
    if (frontend_dir / "pnpm-workspace.yaml").exists():
        result["monorepo"] = "pnpm workspaces"
    elif (frontend_dir / "package.json").exists():
        content = read_file(frontend_dir / "package.json")
        if content and "workspaces" in content:
            result["monorepo"] = "npm workspaces"

    # Git worktrees
    wt_paths = [project_root / ".claude" / "worktrees", project_root / ".git" / "worktrees"]
    for wt_path in wt_paths:
        if wt_path.exists():
            dirs = [d for d in wt_path.iterdir() if d.is_dir()]
            result["git_worktrees"] = len(dirs)
            break

    # CI/CD
    github_wf = project_root / ".github" / "workflows"
    if github_wf.exists():
        workflows = list(github_wf.glob("*.yml")) + list(github_wf.glob("*.yaml"))
        result["ci_cd"] = f"GitHub Actions ({len(workflows)} workflows)"

    # MCP
    if (project_root / "coding-mcp").exists() or (project_root / "mcp-servers").exists():
        result["mcp"] = "Local MCP server configured"

    return result


def detect_directory_structure(project_root: Path) -> list[str]:
    """Build a visual directory tree."""
    lines = ["help-nearby/"]

    frontend_dir = project_root / "frontend"
    if frontend_dir.exists():
        lines.append("├── frontend/          (Next.js app)")
        src = frontend_dir / "src"
        if (src / "app").exists():
            lines.append("│   ├── app/           (App Router pages)")
        if (src / "components").exists():
            lines.append("│   ├── components/    (React components)")
        if (src / "lib").exists():
            lines.append("│   ├── lib/           (Utilities)")
        if (src / "data").exists():
            lines.append("│   ├── data/          (Static data)")
        if (src / "api").exists():
            lines.append("│   ├── api/           (API client)")
        pub = frontend_dir / "public"
        if (pub / "fonts").exists():
            lines.append("│   └── public/fonts/  (Custom fonts)")

    backend_dir = project_root / "backend"
    if backend_dir.exists():
        lines.append("├── backend/           (FastAPI)")
        if (backend_dir / "app").exists():
            lines.append("│   ├── app/           (Application code)")
        if (backend_dir / "alembic").exists():
            lines.append("│   └── alembic/       (Migrations)")

    docs_dir = project_root / "docs"
    if docs_dir.exists():
        lines.append("├── docs/              (Documentation)")

    lines.append("├── .cline/            (Cline config)")
    lines.append("│   └── skills/        (Installed skills)")
    lines.append("└── .gitignore")

    return lines


def detect_skills(project_root: Path) -> list[dict]:
    """Detect installed Cline skills."""
    skills_dir = project_root / ".cline" / "skills"
    skills = []

    if not skills_dir.exists():
        return skills

    for skill_dir in sorted(skills_dir.iterdir()):
        if skill_dir.is_dir():
            skill_md = skill_dir / "SKILL.md"
            if skill_md.exists():
                content = read_file(skill_md)
                name = skill_dir.name
                desc = ""
                if content:
                    m = re.search(r"^description:\s*(.+)$", content, re.MULTILINE)
                    if m:
                        desc = m.group(1).strip()
                skills.append({"name": name, "description": desc})

    return skills


def detect_frontend_api_routes(project_root: Path) -> list[dict]:
    """Detect frontend API routes (Next.js App Router)."""
    routes = []
    api_dir = project_root / "frontend" / "src" / "app" / "api"

    if not api_dir.exists():
        return routes

    for route_path in api_dir.rglob("route.ts"):
        content = read_file(route_path)
        if not content:
            continue

        # Calculate relative path from frontend/src
        rel_path = route_path.relative_to(project_root / "frontend" / "src")
        
        # Extract endpoint path from file location
        # e.g., api/nearby-resources/route.ts -> /api/nearby-resources
        endpoint_parts = []
        path_parts = route_path.parts
        for i, part in enumerate(path_parts):
            if part == "api":
                endpoint_parts.extend(path_parts[i+1:-1])  # Skip route.ts
                break
        endpoint = "/" + "/".join(endpoint_parts) if endpoint_parts else "/api"

        # Detect HTTP methods
        methods = []
        if "export async function GET" in content:
            methods.append("GET")
        if "export async function POST" in content:
            methods.append("POST")
        if "export async function PUT" in content:
            methods.append("PUT")
        if "export async function DELETE" in content:
            methods.append("DELETE")
        if "export async function PATCH" in content:
            methods.append("PATCH")

        # Extract docstring or comment description
        desc = ""
        doc_match = re.search(r'"""([^"]+)"""', content)
        if not doc_match:
            doc_match = re.search(r'//\s*(.+)$', content, re.MULTILINE)
        if doc_match:
            desc = doc_match.group(1).strip()

        routes.append({
            "path": str(rel_path),
            "endpoint": endpoint,
            "methods": methods,
            "description": desc
        })

    return routes


def detect_backend_endpoints(project_root: Path) -> list[dict]:
    """Detect backend API endpoints (FastAPI)."""
    endpoints = []
    main_py = project_root / "backend" / "app" / "main.py"
    
    content = read_file(main_py)
    if not content:
        return endpoints

    # Detect FastAPI decorators
    endpoint_pattern = re.compile(r'@app\.(get|post|put|delete|patch)\s*\(\s*["\']([^"\']+)["\']')
    
    for match in endpoint_pattern.finditer(content):
        method = match.group(1).upper()
        path = match.group(2)
        
        # Find the function definition after the decorator
        start_pos = match.end()
        func_match = re.search(r'def\s+(\w+)\s*\([^)]*\)', content[start_pos:start_pos+500])
        
        if func_match:
            func_name = func_match.group(1)
        else:
            func_name = "unknown"

        # Extract docstring
        desc = ""
        doc_start = content.find('"""', start_pos)
        if doc_start != -1:
            doc_end = content.find('"""', doc_start + 3)
            if doc_end != -1:
                desc = content[doc_start+3:doc_end].strip()

        endpoints.append({
            "function": func_name,
            "method": method,
            "path": path,
            "description": desc
        })

    return endpoints


def generate_execution_commands(frontend: dict, backend: dict) -> list[str]:
    """Generate recommended execution commands."""
    lines = ["```bash", "# Frontend", "cd frontend && pnpm dev          # Start dev server",
             "cd frontend && pnpm build         # Build for production",
             "cd frontend && pnpm lint          # Run ESLint",
             "cd frontend && pnpm test          # Run Jest tests",
             "cd frontend && pnpm format        # Run Prettier", "",
             "# Backend",
             "cd backend && python -m uvicorn app.main:app   # Start API server",
             "cd backend && pytest                              # Run tests",
             "cd backend && alembic upgrade head                # Apply migrations",
             "cd backend && ruff check .                        # Lint with Ruff",
             "cd backend && mypy .                              # Type check",
             "```"]
    return lines


def main():
    project_root = get_project_root()
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


    print("# Project Capability Registry")
    print(f"# Generated: {timestamp}")
    print()

    # Package Managers
    print("## Package Managers")
    managers = detect_package_managers(project_root)
    for m in managers:
        print(f"- **{m}**")
    print()

    # Frontend
    print("## Frontend")
    frontend = detect_frontend(project_root)
    for key, value in frontend.items():
        if isinstance(value, list):
            print(f"- **{key.title()}:** {', '.join(value)}")
        elif isinstance(value, dict):
            for k, v in value.items():
                print(f"- **{k.title()}:** {v}")
        else:
            print(f"- **{key.title()}:** {value}")
    print()

    # Backend
    print("## Backend")
    backend = detect_backend(project_root)
    for key, value in backend.items():
        if isinstance(value, list):
            print(f"- **{key.title()}:** {', '.join(value)}")
        else:
            print(f"- **{key.title()}:** {value}")
    print()

    # Tooling
    print("## Tooling")
    tooling = detect_tooling(project_root)
    for key, value in tooling.items():
        print(f"- **{key.title()}:** {value}")
    print()

    # Directory Structure
    print("## Directory Structure")
    print("```")
    for line in detect_directory_structure(project_root):
        print(line)
    print("```")
    print()

    # Installed Skills
    print("## Installed Skills")
    skills = detect_skills(project_root)
    if skills:
        for skill in skills:
            print(f"- **{skill['name']}** — {skill['description']}")
    else:
        print("- (none)")
    print()

    # API Registry
    print("## API Registry")
    
    # Frontend APIs
    frontend_apis = detect_frontend_api_routes(project_root)
    if frontend_apis:
        print("\n### Frontend (Next.js App Router)")
        for api in frontend_apis:
            methods_str = ", ".join(api["methods"]) if api["methods"] else "unknown"
            print(f"- **{api['endpoint']}** ({methods_str})")
            if api["description"]:
                print(f"  - {api['description']}")
            print(f"  - Location: `{api['path']}`")
    else:
        print("- (no frontend APIs detected)")
    print()
    
    # Backend APIs
    backend_endpoints = detect_backend_endpoints(project_root)
    if backend_endpoints:
        print("\n### Backend (FastAPI)")
        for ep in backend_endpoints:
            print(f"- **{ep['method']} {ep['path']}** ({ep['function']})")
            if ep["description"]:
                print(f"  - {ep['description']}")
    else:
        print("- (no backend endpoints detected)")
    print()

    # Execution Commands
    print("## Execution Commands")
    for line in generate_execution_commands(frontend, backend):
        print(line)


if __name__ == "__main__":
    main()