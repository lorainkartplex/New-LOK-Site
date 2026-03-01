BEGIN { id="" }
/href=.*\/s\/[0-9]+/ {
    match($0, /\/s\/([0-9]+)/, arr)
    id = arr[1]
}
/at-session-list-name/ {
    getline
    gsub(/^[ \t]+/, "")
    gsub(/[ \t]+$/, "")
    if (id != "" && $0 != "") {
        print id "|" $0
        id = ""
    }
}
