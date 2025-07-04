### Architecture Diagram Explained

This diagram is structured into five main layers, flowing from user input to the final rendered output and UI:

1. **Input Layer (Top-Left)**: Captures raw user input from keyboard, mouse, and touch gestures. The `InputManager` and `HammerGestureManager` process these inputs into a state that the game engine can understand.
2. **Game Engine Core (Top-Right)**: This is the heart of the application.
    * `GameEngine`: Acts as the "ticker," running the main game loop using `requestAnimationFrame`.
    * `GameWithEvents`: The central orchestrator class. It initializes all game systems and holds the main `update` and `render` logic. It's extended to emit events.
    * `GameLoop`: The logic driver, called by `Game.update()`. It takes the current input state, reads from the data stores, executes game logic (like entity movement and combat), and dispatches state changes.
3. **Game Systems (Middle-Left)**: These are specialized modules instantiated and managed by the `Game` class to handle specific responsibilities like rendering, audio, wave management, etc.
4. **State Management (Middle-Right)**: This layer uses the [Zustand](https://zustand-demo.pmnd.rs/) library to manage the application's state. It's the "single source of truth."
    * `entityStore`: Holds all game entities (towers, enemies, player).
    * `gameStore`: Holds global game state (currency, lives, score).
    * `uiStore`: Holds the state of UI panels (e.g., if the inventory is open).
5. **React UI Layer (Bottom)**: The entire user interface is built in React. It is decoupled from the game engine and reacts to state changes.
    * `Hooks (use...Store)`: These are the bridge between the UI and the state stores. Components use these hooks to subscribe to state changes.
    * `AppUI` & `GameUI`: These components render the HUD, menus, and other UI panels based on the data from the stores. They also dispatch actions to modify the state (e.g., pausing the game).

The arrows indicate the flow of data and control:

* **Solid Lines (`-->`)**: Represent direct function calls or data passing.
* **Dashed Lines (`-.->`)**: Represent indirect or reactive relationships, such as event emissions or state subscriptions.

```mermaid
flowchart TD
    %% Define styles for different layers
    classDef engine fill:#f9f,stroke:#333,stroke-width:2px,color:#000
    classDef system fill:#ccf,stroke:#333,stroke-width:2px,color:#000
    classDef store fill:#cfc,stroke:#333,stroke-width:2px,color:#000
    classDef ui fill:#ffc,stroke:#333,stroke-width:2px,color:#000
    classDef input fill:#cff,stroke:#333,stroke-width:2px,color:#000

    %% Group components into logical layers using subgraphs
    subgraph "Input Layer"
        direction LR
        KB[("Keyboard & Mouse")] --> IM[InputManager]
        Touch[("Touch Gestures")] --> HGM[HammerGestureManager]
        MobileUI[MobileControls UI] --> IM
    end

    subgraph "Game Engine Core"
        direction TB
        Engine[("GameEngine\n(Ticker)")]
        Game[("GameWithEvents\n(Orchestrator)")]
        Loop[("GameLoop\n(Logic Driver)")]

        Engine -- "drives" --> Game
        Game -- "calls" --> Loop
    end

    subgraph "Game Systems"
        direction TB
        Rend[Renderer]
        Wave[WaveManager]
        Cam[Camera]
        Aud[AudioManager]
        GridSys[Grid]
    end

    subgraph "State (Zustand Stores)"
        direction TB
        GameStore["gameStore\n(currency, lives, score)"]
        EntityStore["entityStore\n(towers, enemies, player)"]
        UIStore["uiStore\n(panel states)"]
    end

    subgraph "React UI Layer"
        direction TB
        AppUI[AppUI\n(Panel Manager)]
        GameUI[GameUI\n(HUD, Controls)]
        Hooks["use...Store()\nHooks"]

        AppUI --> GameUI
        GameUI --> Hooks
    end

    %% --- Data Flow & Interactions ---

    %% Input to Game
    IM -- "provides InputState" --> Loop
    HGM -- "controls" --> Cam

    %% Game Loop Logic
    Loop -- "reads from" --> EntityStore
    Loop -- "reads from" --> GameStore
    Loop -- "dispatches updates to" --> EntityStore
    Loop -- "dispatches updates to" --> GameStore

    %% Game to Systems
    Game -- "instantiates & owns" --> Rend & Wave & Cam & Aud & GridSys & IM & HGM
    Game -- "calls render()" --> Rend

    %% Systems to State
    Rend -- "reads from" --> EntityStore
    Rend -- "reads from" --> Cam
    Rend -- "reads from" --> GridSys
    Wave -- "updates" --> EntityStore

    %% State to UI (Reactive Flow)
    Hooks -.->|"subscribes to"| GameStore
    Hooks -.->|"subscribes to"| EntityStore
    Hooks -.->|"subscribes to"| UIStore

    %% UI to State/Game (Action Flow)
    GameUI -- "dispatches actions to" --> GameStore
    GameUI -- "dispatches actions to" --> UIStore
    GameUI -- "calls methods on" --> Game

    %% Event-based UI Updates (for non-state events like damage numbers)
    Game -.->|"emits events"| GameUI

    %% Apply styles to the nodes
    class Engine,Game,Loop engine
    class Rend,Wave,Cam,Aud,GridSys system
    class GameStore,EntityStore,UIStore store
    class AppUI,GameUI,Hooks ui
    class KB,Touch,MobileUI,IM,HGM input
```
