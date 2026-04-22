# StreamMatch AI - Roadmap v2.0 (Post-Freeze)

Este documento detalla la visión técnica para la evolución de la plataforma tras la estabilización de la v1.0.

## 🎯 Objetivo: Recomendación Hiper-Personalizada

### 1. Atlas Vector Search Integration
Migrar de un sistema puramente basado en LLM a un modelo de búsqueda semántica vectorial.
*   **Tecnología:** MongoDB Atlas Vector Search + OpenAI `text-embedding-3-small`.
*   **Implementación:** Crear un índice vectorial sobre las sinopsis, géneros y metadatos extendidos.
*   **Impacto:** Búsqueda de "vibe" y estética visual, no solo concordancia de palabras clave.

### 2. Hybrid Reranking Engine
Refinar la selección del LLM mediante una capa de validación matemática.
*   **Algoritmo:** Combinar el score de relevancia del LLM con el score de proximidad vectorial (Cosine Similarity).
*   **Filtros Dinámicos:** Aplicar penalizaciones en tiempo real por falta de disponibilidad en plataformas activas.

### 3. Deep Trope Mapping & Knowledge Graph
Enriquecer el modelo de datos con la arquitectura de "Tropos".
*   **Estructura:** Vincular películas por estructuras narrativas (ej: "Survival in Isolation", "Unexpected Betrayal").
*   **Justificación:** El Sommelier podrá dar razones estructurales: *"Como te gustó el suspense de Alien, te sugiero esto por su manejo de la paranoia en espacios cerrados"*.

### 4. Active Feedback Loop (Reinforcement Learning)
Sistema de aprendizaje basado en el comportamiento del usuario.
*   **Métrica:** Tracking de "Hover Time", "Bookmark" y "Dismissal".
*   **Ajuste:** Modificar el `session_context` para que el LLM reciba un "Vector de Interés" actualizado en cada turno.

---

## ❄️ Estado Actual: CODE FREEZE (v1.0)
*   **Rama:** `main`
*   **Prioridad:** Monitoreo de logs (Render/Vercel) y estabilidad de la base de datos Atlas.
*   **Directiva:** Cero modificaciones al código fuente hasta nueva orden del CTO.
