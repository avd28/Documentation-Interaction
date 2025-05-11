import openai, os
from dotenv import load_dotenv
load_dotenv(dotenv_path="secrets/.env")
print("Key:", os.environ.get("OPENAI_API_KEY"))
openai.api_key = os.environ.get("OPENAI_API_KEY")
openai.models.list()  # This should return a list of models if the key is valid