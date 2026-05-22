import sys

def check_balance(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    braces = []
    parens = []
    lines = content.split('\n')
    for i, line in enumerate(lines):
        for char in line:
            if char == '{':
                braces.append(('{', i + 1))
            elif char == '}':
                if not braces:
                    print(f"Extra '}}' at line {i + 1}")
                else:
                    braces.pop()
            elif char == '(':
                parens.append(('(', i + 1))
            elif char == ')':
                if not parens:
                    print(f"Extra ')' at line {i + 1}")
                else:
                    parens.pop()
    
    for char, line in braces:
        print(f"Unmatched '{char}' from line {line}")
    for char, line in parens:
        print(f"Unmatched '{char}' from line {line}")

if __name__ == "__main__":
    check_balance(sys.argv[1])
