
dobrar x = x * 2

duplicar x = x ++ x

main = do
    let msg = "Hello World"
    let duplicada = duplicar msg
    let res = dobrar 5
    let concatenada = duplicada ++ " " ++ show res
    putStrLn concatenada
