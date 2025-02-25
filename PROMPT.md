# my objective was to create an LLM powered recommender system based on my Spotify usage
# and to complete the project end to end within one hour.
#
# tool of choice was Claude 3.7.. the project was a great excuse to kick it's tires.
#
# pure vibing and no attempt of making it structured.

# first prompt
please use nodejs to create a project that connects to my spotify account using oauth gets data about my usage and uses an llm to suggest new artists and music. i should have the ability to tell the project if i like the recommendation or not so it informs the llm next recommendations.

# it used mongodb as backend. to much overhead.
what's more light weight than mongoldb?

# it used OpenAI originally (really Claude?). i want it to use a local llm.
also please use ollama api instead of openai

# bettersqlite does not install cleanly. this was a typical recommedation
# from 3.5 as well..
please use regular sqlite not bettersqlite

# one of the files was missing.. with 3.5 it would probably be more than one.
missing helpers.js please make as separate artifact

# overall it had one bug which i fixed manually, a second app.listen
# otherwise worked out of the box. we are living in the future