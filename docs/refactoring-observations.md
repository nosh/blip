### Refactoring

#### Current State

Blip has been built using the main Controller View (app.js) as the coordinator of most of the work.
 - State is stored and managed here
 - It communicates with the API and then updates state, in turn updating child component state
 -The application uses callbacks to manage asyncronisity
 - It communicates with a Router to update the view. The Router uses Director and a map of function names for various endpoints.
 - There does seem to a consistent naming convention for variables and functions - no Ubiqituous language
 - The application boots after the API is initialised
   - The API module seems to hold state - isLoggedIn()

With all this logic and responsibility in app.js it is hard to understand the flow of the program. Because almost all of the responsibility of taking the the API and updating views falls in app.js it is quite an intimidating file to read through.

Some of the workflows are hard to process. E.g. What happens when first go to Blip and it shows you the login page.

#### Goals for Refactor

 - React Components just concerned with UI
 - Management of State seperated out
 - Simplify and Standardise language and naming of variables
 - Simplification of Parent Component / View Controller
 - Standardisation of managing State, Routes and API communication
 - Improve approachability of codebase for new-hires/open source contributors
 - Ensure testability is not comprimised

#### Possible Solutions

I believe we can pull the state out of the controller view and place it into an intermediary 'store' that maintains this state and informs the view accordingly.

##### 1. React + Vanilla JS

If we focus on the above mentioned goals we can refactor our current vanilla approach and seperate concerns.

Create models for each domain of our application. Defer responsibility for updating state, and talking to an API outside of app.js. This would modularise the code and make it easier to approach. I have created a working branch taking this approach.

###### Pros

 - Flexibility of how much we change and refactor
 - Could be an iterative approach to seperate concerns
 
###### Cons
 - Approach not concrete
 - Not necessarily understandable to others and the open source community
 - May move towards becoming a weak version of Flux when we want to manage two domains of state after an action occurs e.g. implementing waitFor

##### 2. React + Flux + ReactRouter

Refactor the application to have a one-directional flow of information using a flux architecture. Use React Router to manage routing.

The more I consider the Flux architecture, the more I fall in love with its inherent simplicity. We would be able to re-design each component so that we only think of data flowing in one direction. Each component could be designed in isolation. The required props and state could be passed down from parent components. Whenever state changes the component
chain causes an update in child state and appropriate re-rendering. 

Logic for handling responses to events could be stored in one location, per domain. E.g.
 - handlers for all routing events
 - handlers for all auth events

We have the choice of the choice of putting handlers, and message dispatching inside child components, rather than in controller view and passing down as a prop.

This approach is pushed by Facebook. It is approachable, and would allow us to acheive our goals of seperation of concerns, and standardisation.

The main issue with this approach is that the current implementation is vastly different and does not follow similar modelling principles. Some components would have to be re-written.

###### Pros

 - One directional flow simplifies UI components
 - Seperation of Concerns
 - Approachable for other developers and open source community
 - Has a clear defined approach
 
###### Cons
 - Could potentially be a large refactor that is difficult to modularise
 - Number of implementations to choose from
 - Api integration is still a question mark

##### 3. React + Backbone

Use Backbone models, collections, routing and API integration to support UI written in React. 

###### Pros

 - Compliments use of React
 - Still compatible with Flux architecture 
 - Seperation of concerns
 - Approachable for other developers and open source community
 - Has a clear defined approach
 
###### Cons
 - Could potentially be a large refactor that is difficult to modularise

###### Different Flux Implementations

 - Facebook Flux
 - Fluxxor
 - Redux