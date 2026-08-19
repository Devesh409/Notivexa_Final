for model in "gemini-flash-latest" "gemini-pro-latest" "gemini-3.5-flash" "gemini-3.5-flash-lite"; do
  echo "Testing $model..."
  curl -s -H "Content-Type: application/json" \
       -H "x-goog-api-key: ${GEMINI_API_KEY}" \
       -X POST -d '{"contents": [{"parts": [{"text": "hello"}]}]}' \
       "https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent" | grep -v "candidates" | grep -A 5 -B 5 "error" || echo "Success (no error)"
done
