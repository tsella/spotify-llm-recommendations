my objective was to create an LLM powered recommender system based on my Spotify usage
and to complete the project end to end within one hour.

tool of choice was Claude 3.7.. the project was a great excuse to kick it's tires.

pure vibing and no attempt of making it structured.

_first prompt_
```
please use nodejs to create a project that connects to my spotify account using oauth gets data about my usage and uses an llm to suggest new artists and music. i should have the ability to tell the project if i like the recommendation or not so it informs the llm next recommendations.
```

_it used mongodb as backend. too much overhead._
```
what's more light weight than mongoldb?
```

_it used OpenAI originally (really Claude?). i want it to use a local llm._
```
also please use ollama api instead of openai
```

_bettersqlite does not install cleanly. this was a typical recommedation from 3.5 as well.._
```
please use regular sqlite not bettersqlite
```

_one of the files was missing.. with 3.5 it would probably be more than one._
```
missing helpers.js please make as separate artifact
```

overall it had one bug which i fixed manually, a second app.listen otherwise worked out of the box. we are living in the future