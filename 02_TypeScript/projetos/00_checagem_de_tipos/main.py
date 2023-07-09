import random


def gerar():
  if random.randint(0, 10) > 5:
    return 1
  else:
    return "Oi"


x = gerar()
print(x.upper()) # pyright: ignore
