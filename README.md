# Transfer time entries from toggl to Everhour

A script for transferring time entries from a toggl project to a Everhour task.

## How to use

### Installation

```sh
npm install
```

### Running

```sh
cp run.template.sh run.sh
```

* Insert toggl API key
* Insert Everhour API token
* Insert the from date in the format `YYYY-MM-DD` as first argument
* Insert the toggle project id as second argument
* Insert the Everhour task ID as third argument

```sh
./run.sh
```
