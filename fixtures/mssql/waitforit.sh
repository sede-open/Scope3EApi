#!/usr/bin/env bash
#   Use this script to test if a MSSQL server is running on the default port on a host
cmdname=$(basename $0)

echoerr()    { if [[ $QUIET -eq 0 ]]; then echo $@ 1>&2; fi }
echostatus() { if [[ $QUIET -eq 0 ]]; then echo $@     ; fi }

usage() {
    cat << USAGE >&2
Usage:
    $cmdname -h host [-s] [-t timeout] [-- command args]
    -h HOST | --host=HOST       Host or IP under test
    -s | --strict               Only execute subcommand if the test succeeds
    -q | --quiet                Don't output any status messages
    -t TIMEOUT | --timeout=TIMEOUT
                                Timeout in seconds, zero for no timeout
    -- COMMAND ARGS             Execute command with args after the test finishes
USAGE
    exit 1
}
wait_for() {
    if [[ $TIMEOUT -gt 0 ]]; then
        echoerr "$cmdname: waiting $TIMEOUT seconds for $HOST"
    else
        echoerr "$cmdname: waiting for $HOST without a timeout"
    fi

    # sqlcmd won't usually return immediately when things aren't there or ready, so it order to
    # be more true to the specified timeout value we rely on timestamps to determine elapsed time.
    start_ts=$(date +%s)
    abort_ts=$((start_ts + TIMEOUT))
    while [[ $TIMEOUT -eq 0 ]] || [[ $(date +%s) -lt $abort_ts ]]; do
        if /opt/mssql-tools/bin/sqlcmd -S "$HOST" -U sa -P "$SA_PASSWORD" -Q "DROP DATABASE IF EXISTS abc;" >/dev/null 2>&1; then
            end_ts=$(date +%s)
            echostatus
            echostatus "$cmdname: $HOST is available after $((end_ts - start_ts)) seconds"
            return 0
        fi
        echostatus -n .
        sleep 1
    done

    echostatus # add a new line after all of the '.'
    echoerr "Failed waiting for $HOST"
    return 1
}

# process arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        --child)
        CHILD=1
        shift 1
        ;;
        -q | --quiet)
        QUIET=1
        shift 1
        ;;
        -s | --strict)
        STRICT=1
        shift 1
        ;;
        -h)
        HOST="$2"
        if [[ $HOST == "" ]]; then break; fi
        shift 2
        ;;
        --host=*)
        HOST="${1#*=}"
        shift 1
        ;;
        -t)
        TIMEOUT="$2"
        if [[ $TIMEOUT == "" ]]; then break; fi
        shift 2
        ;;
        --timeout=*)
        TIMEOUT="${1#*=}"
        shift 1
        ;;
        --)
        shift
        CLI="$@"
        break
        ;;
        --help)
        usage
        ;;
        *)
        echoerr "Unknown argument: $1"
        usage
        ;;
    esac
done
if [[ "$HOST" == "" ]]; then
    echoerr "Error: you need to provide a host to test."
    usage
fi
TIMEOUT=${TIMEOUT:-15}
STRICT=${STRICT:-0}
CHILD=${CHILD:-0}
QUIET=${QUIET:-0}

wait_for
RESULT=$?

if [[ $CLI != "" ]]; then
    if [[ $RESULT -eq 0 ]] || [[ $STRICT -eq 0 ]]; then
        exec $CLI
    fi
fi
exit $RESULT
