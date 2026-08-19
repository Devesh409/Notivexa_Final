for model in "gemini-2.5-flash" "gemini-2.0-flash" "gemini-2.0-flash-lite" "gemini-2.5-pro" "gemini-flash-latest"; do
  echo "Testing $model..."
  curl -s -H "Content-Type: application/json" \
       -H "x-goog-api-key: ${GEMINI_API_KEY}" \
       -X POST -d '{"contents": [{"parts": [{"text": "hello"}]}]}' \
       "https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent" | grep "error" -A 10
done
