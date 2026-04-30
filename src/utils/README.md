# Utils Module

## ConfigLoader

The `ConfigLoader` class provides a robust configuration loading system for the game. It handles JSON configuration files with validation, error handling, lazy loading, and caching.

### Features

- **JSON Configuration Loading**: Load events, cultivation paths, NPCs, and quests from JSON files
- **Validation**: Automatic validation of configuration structure with detailed error messages
- **Lazy Loading**: Configurations are loaded on-demand
- **Caching**: Loaded configurations are cached to improve performance
- **Error Handling**: Clear error messages for missing files, invalid JSON, and validation failures
- **Hot Reload**: Support for reloading configurations during development

### Usage

#### Basic Usage

```typescript
import { ConfigLoader, ConfigType } from './utils/ConfigLoader';
import * as path from 'path';

// Create a ConfigLoader instance
const configDir = path.join(__dirname, '../data');
const configLoader = new ConfigLoader(configDir);

// Initialize (preloads essential configs)
await configLoader.initialize();

// Load specific configurations
const eventsConfig = await configLoader.loadEvents();
const pathsConfig = await configLoader.loadCultivationPaths();
const npcsConfig = await configLoader.loadNPCs();
const questsConfig = await configLoader.loadQuests();
```

#### Using with EventGenerator

```typescript
import { EventGenerator } from './game/EventGenerator';
import { ConfigLoader } from './utils/ConfigLoader';

const configLoader = new ConfigLoader('./data');
await configLoader.initialize();

const eventGenerator = new EventGenerator();
const eventsConfig = await configLoader.loadEvents();

// Load events into the generator
eventGenerator.loadEventsFromConfig(eventsConfig);
```

#### Caching and Reloading

```typescript
// Check if a config is cached
if (configLoader.isCached(ConfigType.Events)) {
  console.log('Events config is cached');
}

// Reload a configuration (clears cache and reloads)
const freshConfig = await configLoader.reloadConfig(ConfigType.Events);

// Clear all caches
configLoader.clearCache();

// Get list of cached config types
const cachedTypes = configLoader.getCachedConfigTypes();
```

#### Batch Loading

```typescript
// Load all configurations at once
const allConfigs = await configLoader.loadAllConfigs();

const eventsConfig = allConfigs.get(ConfigType.Events);
const pathsConfig = allConfigs.get(ConfigType.CultivationPaths);
const npcsConfig = allConfigs.get(ConfigType.NPCs);
const questsConfig = allConfigs.get(ConfigType.Quests);
```

#### Error Handling

```typescript
import { ConfigValidationError, ConfigLoadError } from './utils/ConfigLoader';

try {
  const config = await configLoader.loadEvents();
} catch (error) {
  if (error instanceof ConfigValidationError) {
    console.error('Validation errors:', error.errors);
    console.error('Config type:', error.configType);
  } else if (error instanceof ConfigLoadError) {
    console.error('Failed to load config:', error.configType);
    console.error('Original error:', error.originalError);
  }
}
```

### Configuration File Format

#### Events Configuration (events.json)

```json
{
  "events": [
    {
      "id": "ancient_cave",
      "type": "fortune",
      "title": "上古洞府",
      "description": "你在山谷中发现一个隐蔽的洞府入口...",
      "triggerConditions": {
        "minCultivationLevel": "qi_refining",
        "probability": 0.15
      },
      "options": [
        {
          "id": "enter",
          "text": "进入探索",
          "description": "高风险高回报",
          "effects": {
            "cultivationChange": 50
          }
        }
      ]
    }
  ]
}
```

#### Cultivation Paths Configuration (cultivation_paths.json)

```json
{
  "paths": [
    {
      "id": "sword",
      "name": "剑修",
      "description": "以剑入道，攻击力强",
      "initialStats": {
        "spiritStones": 10,
        "specialAbility": "剑气"
      },
      "exclusiveEvents": ["sword_master_encounter"],
      "cultivationBonus": 1.0
    }
  ]
}
```

#### NPCs Configuration (npcs.json)

```json
{
  "npcs": [
    {
      "id": "elder_chen",
      "name": "陈长老",
      "faction": "righteous_sect",
      "personality": "strict",
      "initialRelationship": 0,
      "dialogues": {
        "greeting": "年轻人，修行需要持之以恒。",
        "high_relationship": "你很有天赋，我看好你。",
        "low_relationship": "哼，不思进取。"
      }
    }
  ]
}
```

#### Quests Configuration (quests.json)

```json
{
  "quests": [
    {
      "id": "sect_quest_1",
      "title": "宗门任务：采集灵草",
      "description": "宗门发布了采集灵草的任务...",
      "type": "quest",
      "triggerConditions": {
        "minCultivationLevel": "qi_refining"
      },
      "rewards": {
        "spiritStones": 50
      }
    }
  ]
}
```

### Validation Rules

The ConfigLoader validates all configuration files to ensure data integrity:

#### Events Validation
- Must have `events` array
- Each event must have: `id`, `type`, `title`, `description`, `triggerConditions`, `options`
- Options array must not be empty

#### Cultivation Paths Validation
- Must have `paths` array (not empty)
- Each path must have: `id`, `name`, `description`, `initialStats`, `exclusiveEvents`, `cultivationBonus`
- `initialStats.spiritStones` must be a number

#### NPCs Validation
- Must have `npcs` array
- Each NPC must have: `id`, `name`, `faction`, `personality`, `initialRelationship`, `dialogues`

#### Quests Validation
- Must have `quests` array
- Each quest must have: `id`, `title`, `description`

### API Reference

#### Constructor
```typescript
constructor(configDirectory: string)
```

#### Methods

- `initialize(): Promise<void>` - Initialize and preload essential configs
- `loadConfig<T>(configType: ConfigType): Promise<T>` - Load a specific configuration
- `loadEvents(): Promise<EventConfig>` - Load events configuration
- `loadCultivationPaths(): Promise<CultivationPathConfig>` - Load cultivation paths
- `loadNPCs(): Promise<NPCsConfig>` - Load NPCs configuration
- `loadQuests(): Promise<any>` - Load quests configuration
- `loadAllConfigs(): Promise<Map<ConfigType, any>>` - Load all configurations
- `reloadConfig<T>(configType: ConfigType): Promise<T>` - Reload a configuration
- `clearCache(): void` - Clear all cached configurations
- `isCached(configType: ConfigType): boolean` - Check if config is cached
- `getCachedConfigTypes(): ConfigType[]` - Get list of cached config types
- `getConfigDirectory(): string` - Get the configuration directory path
- `setConfigDirectory(directory: string): void` - Set a new configuration directory

### Requirements Validation

This implementation validates the following requirements:

- **15.1**: Load event, NPC, cultivation path, and quest configurations from JSON files
- **15.2**: Load quest/storyline configurations
- **15.3**: Load NPC configurations
- **15.4**: Load cultivation path configurations
- **15.5**: Validate configuration files and provide clear error messages
- **15.6**: Support hot reloading of configuration files (development mode)
